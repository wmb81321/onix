import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Router } from '../lib/router.js'
import { readJsonBody, json } from '../lib/router.js'
import { db, updateTradeStatus } from '../lib/supabase.js'
import { chargeServiceFee } from '../lib/mppx.js'
import { continueAfterFeePaid } from '../flows/flowA.js'
import { deriveDepositAddress } from '../tempo/virtualAddresses.js'
import { watchDeposit } from '../tempo/monitor.js'
import { ENV } from '../lib/env.js'

const DEPOSIT_TIMEOUT_MS = 30 * 60 * 1000   // 30 minutes

const CreateTradeBody = z.object({
  order_id:       z.string().uuid(),
  buyer_address:  z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  seller_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  usdc_amount:    z.number().positive(),
  usd_amount:     z.number().positive(),
})

export function registerTradeRoutes(router: Router): void {

  // POST /trades — create a new trade, derive virtual deposit address, start watcher
  router.post('/trades', async (req, res) => {
    const body = CreateTradeBody.parse(await readJsonBody(req))

    const deadline = new Date(Date.now() + DEPOSIT_TIMEOUT_MS).toISOString()
    const masterId = ENV.AGENT_MASTER_ID as `0x${string}`

    // Atomically lock the order — concurrent requests will find status != 'open' and get 409
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

    // Generate UUID upfront so we can derive the virtual address before writing to DB
    const tradeId = randomUUID()
    const virtualAddress = deriveDepositAddress(masterId, tradeId)

    const { data: trade, error: insertError } = await db
      .from('trades')
      .insert({
        id:              tradeId,
        order_id:        body.order_id,
        buyer_address:   body.buyer_address,
        seller_address:  body.seller_address,
        usdc_amount:     body.usdc_amount,
        usd_amount:      body.usd_amount,
        deposit_deadline: deadline,
        virtual_deposit_address: virtualAddress,
        status: 'created',
      })
      .select('id')
      .single()

    if (insertError ?? !trade) {
      // Roll back the order status so it can be matched again
      await db.from('orders').update({ status: 'open' }).eq('id', body.order_id)
      throw new Error(`Failed to create trade: ${insertError?.message ?? 'no data'}`)
    }

    // Start deposit watcher (non-blocking — do not await)
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

  // POST /trades/:id/settle — charge 0.1 USDC service fee then drive settlement
  router.post('/trades/:id/settle', async (req, res, params) => {
    const tradeId = params['id']
    if (!tradeId) { json(res, 400, { error: 'Missing trade id' }); return }

    // Verify trade exists and is in deposited state
    const { data: trade, error } = await db
      .from('trades')
      .select('id, status')
      .eq('id', tradeId)
      .single()

    if (error ?? !trade) { json(res, 404, { error: 'Trade not found' }); return }
    if (trade.status !== 'deposited') {
      json(res, 409, { error: `Trade is in state ${trade.status}, expected deposited` })
      return
    }

    // Charge 0.1 USDC service fee via MPP 402
    // If payment is pending, chargeServiceFee writes the 402 challenge to res and returns 402.
    const charge = await chargeServiceFee(req, res, tradeId)
    if (charge.status === 402) return   // client must pay and retry

    // Fee received — drive the settlement
    await continueAfterFeePaid(tradeId)
    json(res, 200, { status: 'fiat_sent' })
  })
}
