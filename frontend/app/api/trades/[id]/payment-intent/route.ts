import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.preview' as Stripe.LatestApiVersion,
})

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tradeId } = await params
  const db = createServerClient()

  const { data: trade } = await db
    .from('trades')
    .select('id, status, usd_amount, stripe_payment_intent_id, seller_address')
    .eq('id', tradeId)
    .single()

  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  if (trade.status !== 'deposited') {
    return NextResponse.json(
      { error: `Trade is ${trade.status}, expected deposited` },
      { status: 409 },
    )
  }

  // Verify the seller's Stripe Connect account is active before creating the PI
  const { data: seller } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', trade.seller_address)
    .single()

  if (!seller?.stripe_account) {
    return NextResponse.json(
      { error: 'Seller has not connected a Stripe account' },
      { status: 409 },
    )
  }

  const sellerAccount = await stripe.accounts.retrieve(seller.stripe_account)
  if (!sellerAccount.charges_enabled) {
    return NextResponse.json(
      { error: 'Seller Stripe account is not yet fully verified' },
      { status: 409 },
    )
  }

  // Idempotent — return existing PI client secret if one was already created
  if (trade.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(trade.stripe_payment_intent_id)
    if (pi.client_secret) {
      return NextResponse.json({ client_secret: pi.client_secret })
    }
  }

  // Trade amount in cents + 10 cents service fee
  const amountCents = Math.round(Number(trade.usd_amount) * 100) + 10

  const pi = await stripe.paymentIntents.create({
    amount:   amountCents,
    currency: 'usd',
    metadata: { trade_id: tradeId },
    automatic_payment_methods: { enabled: true },
  })

  // Persist PI ID before returning — crash-safe, idempotent on retry
  await db
    .from('trades')
    .update({ stripe_payment_intent_id: pi.id })
    .eq('id', tradeId)

  if (!pi.client_secret) {
    return NextResponse.json({ error: 'PaymentIntent has no client secret' }, { status: 500 })
  }

  return NextResponse.json({ client_secret: pi.client_secret })
}
