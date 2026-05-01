import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.preview' as Stripe.LatestApiVersion,
})

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  const db = createServerClient()
  const { data: user } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', address)
    .single()

  if (!user?.stripe_account) {
    return NextResponse.json({ connected: false, account_id: null, details_submitted: false })
  }

  const account = await stripe.accounts.retrieve(user.stripe_account)

  return NextResponse.json({
    connected:         true,
    account_id:        account.id,
    details_submitted: account.details_submitted,
    charges_enabled:   account.charges_enabled,
  })
}
