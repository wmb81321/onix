/**
 * Flow Manual — direct counterparty settlement.
 *
 * State machine:
 *   created → deposited → payment_sent → payment_confirmed → released → complete
 *
 * 1. Seller deposits USDC to virtual address (auto-forwarded to master).
 * 2. Buyer pays seller directly (Zelle, bank transfer, etc.) and marks sent.
 * 3. Seller confirms receipt → agent releases USDC on-chain to buyer.
 *
 * Crash-safety: Supabase state written BEFORE every on-chain side-effect.
 * Idempotent: every function checks current state before acting.
 */

import { db, updateTradeStatus } from '../lib/supabase.js'
import { TradeRowSchema } from '../lib/schemas.js'
import { transferUsdc } from '../tempo/wallet.js'

async function fetchTrade(tradeId: string) {
  const { data, error } = await db
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .single()
  if (error ?? !data) throw new Error(`Trade ${tradeId} not found: ${error?.message ?? 'no data'}`)
  return TradeRowSchema.parse(data)
}

/**
 * Drives: deposited → payment_sent
 * Called by POST /trades/:id/payment-sent
 */
export async function markPaymentSent(
  tradeId: string,
  method: string,
  reference: string,
  proofUrl?: string,
): Promise<void> {
  const trade = await fetchTrade(tradeId)

  // Idempotent — already past this stage
  if (
    trade.status === 'payment_sent'      ||
    trade.status === 'payment_confirmed' ||
    trade.status === 'released'          ||
    trade.status === 'complete'
  ) return

  if (trade.status !== 'deposited') {
    throw new Error(
      `Cannot mark payment sent for trade ${tradeId}: expected deposited, got ${trade.status}`,
    )
  }

  await updateTradeStatus(tradeId, 'payment_sent', {
    payment_method:    method,
    payment_reference: reference,
    payment_proof_url: proofUrl ?? null,
    payment_sent_at:   new Date().toISOString(),
  })

  console.log(`[flowManual] Trade ${tradeId} → payment_sent via ${method}`)
}

/**
 * Drives: payment_sent → payment_confirmed → released → complete
 * Called by POST /trades/:id/confirm-payment (seller action)
 */
export async function confirmPayment(
  tradeId: string,
  confirmerAddress: string,
): Promise<void> {
  const trade = await fetchTrade(tradeId)

  // Idempotent — already released
  if (trade.status === 'released' || trade.status === 'complete') return

  if (trade.status !== 'payment_sent') {
    throw new Error(
      `Cannot confirm payment for trade ${tradeId}: expected payment_sent, got ${trade.status}`,
    )
  }

  if (confirmerAddress.toLowerCase() !== trade.seller_address.toLowerCase()) {
    throw new Error(`Only the seller can confirm payment receipt for trade ${tradeId}`)
  }

  // Write confirmed BEFORE on-chain transfer — crash-safe
  await updateTradeStatus(tradeId, 'payment_confirmed', {
    payment_confirmed_at: new Date().toISOString(),
  })
  console.log(`[flowManual] Trade ${tradeId} → payment_confirmed`)

  // Write released BEFORE transfer
  await updateTradeStatus(tradeId, 'released')

  const txHash = await transferUsdc(
    trade.buyer_address as `0x${string}`,
    trade.usdc_amount,
  )

  console.log(`[flowManual] Trade ${tradeId} → released (tx ${txHash})`)

  await updateTradeStatus(tradeId, 'complete')
  console.log(`[flowManual] Trade ${tradeId} → complete`)
}
