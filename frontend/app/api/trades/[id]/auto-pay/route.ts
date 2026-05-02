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
  const { id } = await params
  const db = createServerClient()

  const { data: trade, error: tradeErr } = await db
    .from('trades')
    .select('id, buyer_address, seller_address, usd_amount, stripe_payment_intent_id, status')
    .eq('id', id)
    .single()

  if (tradeErr || !trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }
  if (trade.status !== 'deposited') {
    return NextResponse.json({ error: `Trade not payable (status: ${trade.status})` }, { status: 409 })
  }
  if (trade.stripe_payment_intent_id) {
    return NextResponse.json({ ok: true, already: true, payment_intent_id: trade.stripe_payment_intent_id })
  }

  const { data: buyer } = await db
    .from('users')
    .select('stripe_customer_id, stripe_buyer_pm_id')
    .eq('address', trade.buyer_address)
    .single()

  if (!buyer?.stripe_customer_id || !buyer.stripe_buyer_pm_id) {
    return NextResponse.json({ error: 'Buyer has no saved payment method. Visit /account to add one.' }, { status: 402 })
  }

  const { data: seller } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', trade.seller_address)
    .single()

  if (seller?.stripe_account) {
    const acct = await stripe.accounts.retrieve(seller.stripe_account)
    if (!acct.charges_enabled) {
      return NextResponse.json({ error: 'Seller Stripe account not fully set up' }, { status: 409 })
    }
  }

  const amountCents = Math.round(Number(trade.usd_amount) * 100) + 10

  const pi = await stripe.paymentIntents.create({
    amount:         amountCents,
    currency:       'usd',
    customer:       buyer.stripe_customer_id,
    payment_method: buyer.stripe_buyer_pm_id,
    confirm:        true,
    off_session:    true,
    metadata:       { trade_id: id },
    ...(seller?.stripe_account ? {
      transfer_data: { destination: seller.stripe_account },
    } : {}),
  })

  await db
    .from('trades')
    .update({ stripe_payment_intent_id: pi.id })
    .eq('id', id)

  return NextResponse.json({ ok: true, payment_intent_id: pi.id, status: pi.status })
}
