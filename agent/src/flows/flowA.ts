/**
 * Flow A — Crypto → Fiat settlement orchestrator.
 *
 * State machine: created → deposited → fee_paid → fiat_sent → released → complete
 *
 * Entry points:
 *   - continueAfterFeePaid(): deposited|fee_paid → fiat_sent (Stripe transfer to seller)
 *     Called by: payment_intent.succeeded webhook (Phase 4 PaymentElement buyer flow)
 *                POST /trades/:id/settle after mppx fee payment (legacy settle path)
 *   - releaseUsdcToBuyer(): fiat_sent → released (on-chain USDC to buyer)
 *     Called by: transfer.paid webhook
 *
 * Crash-safety rule: Supabase state is written BEFORE each side-effect.
 * Every function is idempotent — safe to call twice at the same state.
 */

import type Stripe from 'stripe'

import { db, updateTradeStatus } from '../lib/supabase.js'
import { TradeRowSchema } from '../lib/schemas.js'
import { sendFiatToSeller } from '../stripe/payouts.js'
import { registerWebhookHandler } from '../stripe/webhook.js'
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
 * Drives: deposited → fee_paid → fiat_sent
 *
 * Accepts two entry states:
 *   'deposited' — arriving from the payment_intent.succeeded webhook (Phase 4)
 *   'fee_paid'  — arriving from the legacy mppx /settle path
 */
export async function continueAfterFeePaid(tradeId: string): Promise<void> {
  const trade = await fetchTrade(tradeId)

  // Already past this stage — idempotent exit
  if (
    trade.status === 'fiat_sent' ||
    trade.status === 'released'  ||
    trade.status === 'complete'
  ) return

  if (trade.status !== 'deposited' && trade.status !== 'fee_paid') {
    throw new Error(
      `Cannot continue settlement for trade ${tradeId}: unexpected status ${trade.status}`,
    )
  }

  // Step 1: persist fee_paid BEFORE Stripe side-effect
  if (trade.status !== 'fee_paid') {
    await updateTradeStatus(tradeId, 'fee_paid')
  }

  // Resolve seller's Stripe Connect account
  const { data: seller } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', trade.seller_address)
    .single()

  if (!seller?.stripe_account) {
    throw new Error(
      `Seller ${trade.seller_address} has no Stripe account — onboarding incomplete`,
    )
  }

  // Step 2: persist fiat_sent BEFORE Stripe transfer.
  // If we crash here, stripe_payout_id will be null; on retry sendFiatToSeller
  // uses tradeId as idempotency key — safe to call again.
  await updateTradeStatus(tradeId, 'fiat_sent', {
    stripe_account_id: seller.stripe_account,
  })

  // Step 3: execute Stripe transfer (idempotency key = tradeId prevents double-send)
  const transferId = await sendFiatToSeller(
    seller.stripe_account,
    trade.usd_amount,
    tradeId,
  )

  // Step 4: record transfer ID for webhook reconciliation
  await updateTradeStatus(tradeId, 'fiat_sent', { stripe_payout_id: transferId })

  console.log(`[flowA] Trade ${tradeId} → fiat_sent (Stripe transfer ${transferId})`)
}

/**
 * Called by Stripe webhook when the transfer to the seller settles.
 * Drives: fiat_sent → released
 */
async function releaseUsdcToBuyer(tradeId: string): Promise<void> {
  const trade = await fetchTrade(tradeId)

  if (trade.status === 'released' || trade.status === 'complete') return
  if (trade.status !== 'fiat_sent') {
    throw new Error(
      `Cannot release USDC for trade ${tradeId}: expected fiat_sent, got ${trade.status}`,
    )
  }

  // Persist released BEFORE on-chain transfer — crash-safe
  await updateTradeStatus(tradeId, 'released')

  const txHash = await transferUsdc(
    trade.buyer_address as `0x${string}`,
    trade.usdc_amount,
  )

  console.log(`[flowA] Trade ${tradeId} → released (tx ${txHash})`)
}

/**
 * Triggered by payment_intent.succeeded when buyer pays via Stripe PaymentElement.
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent
  const tradeId = pi.metadata['trade_id']

  if (!tradeId) {
    console.log('[flowA] payment_intent.succeeded — no trade_id in metadata, skipping')
    return
  }

  console.log(`[flowA] payment_intent.succeeded → settling trade ${tradeId}`)
  await continueAfterFeePaid(tradeId)
}

/**
 * Register all Stripe event handlers for Flow A.
 * Call once at agent startup before accepting trades.
 */
export function registerFlowAHandlers(): void {
  // Fires when transfer to seller's Connect account is confirmed
  registerWebhookHandler('transfer.paid', async (event: Stripe.Event) => {
    const transfer = event.data.object as Stripe.Transfer
    const tradeId  = transfer.transfer_group

    if (!tradeId) {
      console.log('[flowA] transfer.paid — no transfer_group, skipping')
      return
    }

    console.log(`[flowA] transfer.paid → releasing USDC for trade ${tradeId}`)
    await releaseUsdcToBuyer(tradeId)
  })

  // Fires when buyer completes payment via Stripe PaymentElement (Phase 4)
  registerWebhookHandler('payment_intent.succeeded', handlePaymentIntentSucceeded)
}
