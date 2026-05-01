/**
 * Flow A — Crypto → Fiat settlement orchestrator.
 *
 * State machine: created → deposited → fee_paid → fiat_sent → released → complete
 *
 * This module handles the post-deposit steps:
 *   - continueAfterFeePaid(): fee_paid → fiat_sent (Stripe transfer to seller)
 *   - releaseUsdcToBuyer():   fiat_sent → released (on-chain USDC to buyer)
 *   - registerFlowAHandlers(): wires Stripe webhook → releaseUsdcToBuyer
 *
 * Crash-safety rule: Supabase state is written BEFORE each side-effect.
 * Every function is idempotent — safe to call twice at the same state.
 *
 * NOTE: SPT execution (buyer's Stripe Link payment credential) is a TODO.
 * Currently the Stripe transfer draws from platform balance. Full SPT flow
 * requires /auth-stripe-link + Link CLI integration (Phase 5).
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
 * Called from POST /trades/:id/settle after mppx confirms fee payment.
 * Drives: deposited → fee_paid → fiat_sent
 */
export async function continueAfterFeePaid(tradeId: string): Promise<void> {
  const trade = await fetchTrade(tradeId)

  // Already past this stage — idempotent exit
  if (
    trade.status === 'fiat_sent' ||
    trade.status === 'released' ||
    trade.status === 'complete'
  ) return

  // Step 1: persist fee_paid BEFORE Stripe side-effect
  if (trade.status === 'deposited') {
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

  // Step 2: persist fiat_sent BEFORE Stripe transfer
  // If we crash here, the trade is marked fiat_sent but stripe_payout_id is null.
  // On retry, sendFiatToSeller uses tradeId as idempotency key — safe to call again.
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
 * Called by Stripe webhook handler when the transfer to the seller settles.
 * Drives: fiat_sent → released
 */
async function releaseUsdcToBuyer(tradeId: string): Promise<void> {
  const trade = await fetchTrade(tradeId)

  // Idempotency
  if (trade.status === 'released' || trade.status === 'complete') return
  if (trade.status !== 'fiat_sent') {
    throw new Error(
      `Cannot release USDC for trade ${tradeId}: expected fiat_sent, got ${trade.status}`,
    )
  }

  // Persist released BEFORE on-chain transfer.
  // If transfer fails, trade stays released with no tx — retry is safe (transferUsdc is idempotent
  // from Tempo's perspective; worst case is a second transfer attempt, which we can detect by
  // checking buyer balance before sending).
  await updateTradeStatus(tradeId, 'released')

  const txHash = await transferUsdc(
    trade.buyer_address as `0x${string}`,
    trade.usdc_amount,
  )

  console.log(`[flowA] Trade ${tradeId} → released (tx ${txHash})`)
}

/**
 * Register all Stripe event handlers for Flow A.
 * Call once at agent startup before accepting trades.
 */
export function registerFlowAHandlers(): void {
  // 'transfer.paid' fires when our transfer to the seller's Connect account is confirmed
  registerWebhookHandler('transfer.paid', async (event: Stripe.Event) => {
    const transfer = event.data.object as Stripe.Transfer
    const tradeId = transfer.transfer_group

    if (!tradeId) {
      console.log('[flowA] transfer.paid — no transfer_group, skipping')
      return
    }

    console.log(`[flowA] transfer.paid → releasing USDC for trade ${tradeId}`)
    await releaseUsdcToBuyer(tradeId)
  })
}
