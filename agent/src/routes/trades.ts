import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Router } from '../lib/router.js'
import { readJsonBody, json } from '../lib/router.js'
import { db, updateTradeStatus } from '../lib/supabase.js'
import { chargeServiceFee } from '../lib/mppx.js'
import { continueAfterFeePaid } from '../flows/flowA.js'
import { deriveDepositAddress } from '../tempo/virtualAddresses.js'
import { watchDeposit } from '../tempo/monitor.js'
import { stripe } from '../stripe/client.js'
import { createSpendRequest, requestApproval, pollForApproval, getCard } from '../lib/link.js'
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

    // Ensure both party rows exist before the trade FK insert
    await db.from('users').upsert(
      [{ address: body.buyer_address }, { address: body.seller_address }],
      { onConflict: 'address', ignoreDuplicates: true },
    )

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

  // POST /trades/:id/link-pay — create Stripe Link spend request and pay server-side on approval
  router.post('/trades/:id/link-pay', async (req, res, params) => {
    const tradeId = params['id']
    if (!tradeId) { json(res, 400, { error: 'Missing trade id' }); return }

    const { data: trade, error } = await db
      .from('trades')
      .select('id, status, buyer_address, usdc_amount, usd_amount')
      .eq('id', tradeId)
      .single()

    if (error ?? !trade) { json(res, 404, { error: 'Trade not found' }); return }
    if (trade.status !== 'deposited') {
      json(res, 409, { error: `Trade is ${trade.status}, expected deposited` })
      return
    }

    // Resolve buyer's Link payment method ID (per-user or env default)
    const { data: buyer } = await db
      .from('users')
      .select('link_payment_method_id')
      .eq('address', trade.buyer_address)
      .single()

    const pmId = buyer?.link_payment_method_id

    if (!pmId) {
      json(res, 402, {
        error: 'Buyer has no Stripe Link payment method registered.',
        action: 'Visit /account → "Stripe Link" to add your Link PM ID (csmrpd_...).',
      })
      return
    }

    const amountCents = Math.round(Number(trade.usd_amount) * 100) + 10
    const context = [
      `Convexo P2P trade ${(tradeId as string).slice(0, 8)}:`,
      `pay $${(amountCents / 100).toFixed(2)} USD to receive`,
      `${Number(trade.usdc_amount).toFixed(2)} USDC on the Tempo blockchain.`,
      'This is a peer-to-peer exchange — USDC is held in escrow and',
      'will be released to your wallet automatically once your USD payment confirms.',
    ].join(' ')

    const testMode = ENV.STRIPE_SECRET_KEY.startsWith('sk_test_')
    const sr = await createSpendRequest(pmId, amountCents, context, testMode)

    // Persist so agent can resume after restart
    await db.from('trades').update({ link_spend_request_id: sr.id }).eq('id', tradeId)

    json(res, 200, { spendRequestId: sr.id, approvalUrl: sr.approvalUrl })

    // Background: request push notification → poll for approval → pay server-side
    void (async () => {
      try {
        await requestApproval(sr.id)

        const outcome = await pollForApproval(sr.id)
        if (outcome !== 'approved') {
          if (outcome === 'denied') await updateTradeStatus(tradeId, 'stripe_failed')
          console.log(`[link-pay] Spend request ${outcome} for trade ${tradeId}`)
          return
        }

        const card = await getCard(sr.id)

        const pm = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            number:    card.number,
            exp_month: card.exp_month,
            exp_year:  card.exp_year,
            cvc:       card.cvc,
          },
          billing_details: card.billing_address ? {
            name:    card.billing_address.name    ?? undefined,
            address: {
              line1:       card.billing_address.line1       ?? undefined,
              city:        card.billing_address.city        ?? undefined,
              state:       card.billing_address.state       ?? undefined,
              postal_code: card.billing_address.postal_code ?? undefined,
              country:     card.billing_address.country     ?? undefined,
            },
          } : undefined,
        })

        // Create + confirm PI server-side — triggers payment_intent.succeeded webhook → Flow A
        const pi = await stripe.paymentIntents.create({
          amount:         amountCents,
          currency:       'usd',
          payment_method: pm.id,
          confirm:        true,
          metadata:       { trade_id: tradeId },
          return_url:     `${ENV.FACILITATOR_URL}/stripe/payment-return/${tradeId}`,
        })

        await db.from('trades').update({ stripe_payment_intent_id: pi.id }).eq('id', tradeId)
        console.log(`[link-pay] Trade ${tradeId} → PI ${pi.id} (${pi.status}) via Stripe Link`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[link-pay] Background error for trade ${tradeId}:`, msg)
      }
    })()
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
