import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Router } from '../lib/router.js'
import { readJsonBody, json } from '../lib/router.js'
import { db } from '../lib/supabase.js'
import { chargeServiceFee } from '../lib/mppx.js'
import { deriveDepositAddress } from '../tempo/virtualAddresses.js'
import { ENV } from '../lib/env.js'

const CreateOrderBody = z.object({
  user_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  type:         z.enum(['buy', 'sell']),
  usdc_amount:  z.number().min(5, 'Minimum order is 5 USDC'),
  rate:         z.number().positive('Rate must be positive'),
})

const CancelOrderBody = z.object({
  user_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/i),
})

export function registerOrderRoutes(router: Router): void {

  // POST /orders — public (mppx 0.1 USDC payment IS the auth)
  // Fee is charged once at order creation; forfeited on cancel/expiry (no mppx refund).
  router.post('/orders', async (req, res) => {
    const parsed = CreateOrderBody.safeParse(await readJsonBody(req))
    if (!parsed.success) {
      json(res, 400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }
    const { user_address, type, usdc_amount, rate } = parsed.data
    const orderId = randomUUID()

    // Charge fee first — externalId binds the charge to this order ID for idempotency.
    // mppx writes the 402 challenge to res automatically if payment is pending.
    const charge = await chargeServiceFee(req, res, orderId)
    if (charge.status === 402) return

    // Fee paid — derive VA (pure-compute, no on-chain write), then persist order.
    const masterId = ENV.AGENT_MASTER_ID as `0x${string}`
    const virtualAddress = deriveDepositAddress(masterId, orderId)
    const usdAmount = Math.round(usdc_amount * rate * 100) / 100

    await db
      .from('users')
      .upsert({ address: user_address }, { onConflict: 'address', ignoreDuplicates: true })

    const { data: order, error } = await db
      .from('orders')
      .insert({
        id:                      orderId,
        user_address,
        type,
        usdc_amount,
        usd_amount:              usdAmount,
        rate,
        virtual_deposit_address: virtualAddress,
        service_fee_paid_at:     new Date().toISOString(),
      })
      .select()
      .single()

    if (error ?? !order) {
      // Fee was collected but the DB insert failed — log loudly for manual recovery.
      console.error(`[orders] CRITICAL: fee paid for order ${orderId} but insert failed:`, error)
      json(res, 500, {
        error: 'Order creation failed after payment — contact support',
        order_id: orderId,
      })
      return
    }

    console.log(`[orders] Order ${orderId} created — VA ${virtualAddress}`)
    json(res, 201, order)
  })

  // POST /orders/:id/cancel — Bearer auth; owner-only cancellation (DB-only).
  // Note: the VA persists on-chain forever; the service fee is forfeited.
  router.post('/orders/:id/cancel', async (req, res, params) => {
    const orderId = params['id']
    if (!orderId) { json(res, 400, { error: 'Missing order id' }); return }

    const parsed = CancelOrderBody.safeParse(await readJsonBody(req))
    if (!parsed.success) {
      json(res, 400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }
    const { user_address } = parsed.data

    const { data: order } = await db
      .from('orders')
      .select('user_address, status')
      .eq('id', orderId)
      .single()

    if (!order) { json(res, 404, { error: 'Order not found' }); return }
    if (order.user_address.toLowerCase() !== user_address.toLowerCase()) {
      json(res, 403, { error: 'Not the order owner' })
      return
    }
    if (order.status !== 'open') {
      json(res, 409, { error: `Order is ${order.status}` })
      return
    }

    const { error } = await db
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('status', 'open')

    if (error) throw new Error(`Cancel failed: ${error.message}`)

    console.log(`[orders] Order ${orderId} cancelled by ${user_address}`)
    json(res, 200, { ok: true, status: 'cancelled' })
  })
}
