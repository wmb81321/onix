import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Router } from '../lib/router.js'
import { readJsonBody, json } from '../lib/router.js'
import { db, updateTradeStatus } from '../lib/supabase.js'
import { chargeServiceFee } from '../lib/mppx.js'
import { markPaymentSent, confirmPayment } from '../flows/flowManual.js'
import { deriveDepositAddress } from '../tempo/virtualAddresses.js'
import { watchDeposit } from '../tempo/monitor.js'
import { ENV } from '../lib/env.js'

const DEPOSIT_TIMEOUT_MS = 30 * 60 * 1000

const CreateTradeBody = z.object({
  order_id:       z.string().uuid(),
  buyer_address:  z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  seller_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  usdc_amount:    z.number().positive(),
  usd_amount:     z.number().positive(),
})

const PaymentSentBody = z.object({
  buyer_address:     z.string().regex(/^0x[0-9a-fA-F]{40}$/i),
  payment_method:    z.string().min(1).max(50),
  payment_reference: z.string().min(1).max(200),
  payment_proof_url: z.string().url().optional(),
})

const ConfirmPaymentBody = z.object({
  seller_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/i),
})

export function registerTradeRoutes(router: Router): void {

  // POST /trades — create trade, derive virtual deposit address, start deposit watcher
  router.post('/trades', async (req, res) => {
    const body = CreateTradeBody.parse(await readJsonBody(req))

    const deadline = new Date(Date.now() + DEPOSIT_TIMEOUT_MS).toISOString()
    const masterId = ENV.AGENT_MASTER_ID as `0x${string}`

    // Atomically lock the order — concurrent requests find status != 'open' and get 409
    const { data: matchedOrder, error: matchError } = await db
      .from('orders')
      .update({ status: 'matched' })
      .eq('id', body.order_id)
      .eq('status', 'open')
      .select('id')
      .maybeSingle()

    if (matchError) throw new Error(`Failed to match order: ${matchError.message}`)
    if (!matchedOrder) {
      json(res, 409, { error: 'Order is no longer available' })
      return
    }

    const tradeId = randomUUID()
    const virtualAddress = deriveDepositAddress(masterId, tradeId)

    await db.from('users').upsert(
      [{ address: body.buyer_address }, { address: body.seller_address }],
      { onConflict: 'address', ignoreDuplicates: true },
    )

    const { data: trade, error: insertError } = await db
      .from('trades')
      .insert({
        id:                      tradeId,
        order_id:                body.order_id,
        buyer_address:           body.buyer_address,
        seller_address:          body.seller_address,
        usdc_amount:             body.usdc_amount,
        usd_amount:              body.usd_amount,
        deposit_deadline:        deadline,
        virtual_deposit_address: virtualAddress,
        status:                  'created',
      })
      .select('id')
      .single()

    if (insertError ?? !trade) {
      await db.from('orders').update({ status: 'open' }).eq('id', body.order_id)
      throw new Error(`Failed to create trade: ${insertError?.message ?? 'no data'}`)
    }

    const expectedAmount = BigInt(Math.round(body.usdc_amount * 1e6))
    const deadlineMs = Date.now() + DEPOSIT_TIMEOUT_MS

    watchDeposit(
      virtualAddress,
      trade.id,
      ENV.TEMPO_PATHUSDC_ADDRESS as `0x${string}`,
      expectedAmount,
      deadlineMs,
    ).then(async (result) => {
      if (result === 'timeout') {
        await updateTradeStatus(trade.id, 'deposit_timeout')
        console.log(`[trades] Trade ${trade.id} → deposit_timeout`)
      }
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[trades] Deposit watcher error for ${trade.id}:`, msg)
    })

    console.log(`[trades] Trade ${trade.id} created — deposit address ${virtualAddress}`)
    json(res, 201, { trade_id: trade.id, virtual_deposit_address: virtualAddress, deposit_deadline: deadline })
  })

  // POST /trades/:id/payment-sent — buyer marks fiat as sent (Bearer auth, web UI path)
  router.post('/trades/:id/payment-sent', async (req, res, params) => {
    const tradeId = params['id']
    if (!tradeId) { json(res, 400, { error: 'Missing trade id' }); return }

    const parsed = PaymentSentBody.safeParse(await readJsonBody(req))
    if (!parsed.success) {
      json(res, 400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }

    const { buyer_address, payment_method, payment_reference, payment_proof_url } = parsed.data

    const { data: trade } = await db
      .from('trades')
      .select('buyer_address, status')
      .eq('id', tradeId)
      .single()

    if (!trade) { json(res, 404, { error: 'Trade not found' }); return }
    if (trade.buyer_address.toLowerCase() !== buyer_address.toLowerCase()) {
      json(res, 403, { error: 'Not the buyer of this trade' })
      return
    }

    try {
      await markPaymentSent(tradeId, payment_method, payment_reference, payment_proof_url)
      json(res, 200, { ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      json(res, 409, { error: msg })
    }
  })

  // POST /trades/:id/confirm-payment — seller confirms receipt, triggers USDC release (Bearer auth)
  router.post('/trades/:id/confirm-payment', async (req, res, params) => {
    const tradeId = params['id']
    if (!tradeId) { json(res, 400, { error: 'Missing trade id' }); return }

    const parsed = ConfirmPaymentBody.safeParse(await readJsonBody(req))
    if (!parsed.success) {
      json(res, 400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }

    try {
      await confirmPayment(tradeId, parsed.data.seller_address)
      json(res, 200, { ok: true, status: 'complete' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const code = msg.includes('Only the seller') ? 403 : 409
      json(res, code, { error: msg })
    }
  })

  // POST /trades/:id/settle — x402 / mppx path for agent consumers
  // Public endpoint — 0.1 USDC payment via MPP IS the auth.
  // Marks payment_sent with method='x402', then requires confirm-payment to release USDC.
  router.post('/trades/:id/settle', async (req, res, params) => {
    const tradeId = params['id']
    if (!tradeId) { json(res, 400, { error: 'Missing trade id' }); return }

    const { data: trade, error } = await db
      .from('trades')
      .select('id, status')
      .eq('id', tradeId)
      .single()

    if (error ?? !trade) { json(res, 404, { error: 'Trade not found' }); return }
    if (trade.status !== 'deposited') {
      json(res, 409, { error: `Trade is ${trade.status}, expected deposited` })
      return
    }

    // Charge 0.1 USDC service fee via MPP — writes 402 challenge if not yet paid
    const charge = await chargeServiceFee(req, res, tradeId)
    if (charge.status === 402) return  // client must pay and retry

    // Fee received — mark payment sent via x402
    await markPaymentSent(tradeId, 'x402', tradeId)
    json(res, 200, {
      status:    'payment_sent',
      next_step: 'Seller must confirm receipt at POST /trades/:id/confirm-payment to release USDC.',
    })
  })
}
