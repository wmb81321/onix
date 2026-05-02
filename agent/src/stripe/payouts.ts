/**
 * Stripe Global Payouts — push USD to a seller's Stripe Link account.
 *
 * Preconditions (enforced by caller, not here):
 *   - seller has a Stripe Connect account (users.stripe_account is set)
 *   - that account has a payout method linked via Connection Session
 *
 * Flow A: agent transfers USD from platform balance → seller's Connect account.
 * Stripe automatically pays out to the seller's linked bank/card per their
 * payout schedule. The transfer ID is stored on the trade row so the
 * Stripe webhook can reconcile the settled event.
 */

import { stripe } from './client.js'

export async function sendFiatToSeller(
  stripeAccountId: string,
  usdAmount: number,
  tradeId: string,
): Promise<string> {
  const amountCents = Math.round(usdAmount * 100)

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: stripeAccountId,
    transfer_group: tradeId,
    metadata: { trade_id: tradeId },
  })

  return transfer.id
}

