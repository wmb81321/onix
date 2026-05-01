import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.preview' as Stripe.LatestApiVersion,
})

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address || !/^0x[0-9a-fA-F]{40}$/i.test(address)) {
    return NextResponse.redirect(new URL('/account', req.url))
  }

  const db = createServerClient()
  const { data: user } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', address)
    .single()

  if (!user?.stripe_account) {
    return NextResponse.redirect(new URL('/account', req.url))
  }

  const host  = req.headers.get('host') ?? 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const base  = `${proto}://${host}`

  const link = await stripe.accountLinks.create({
    account:     user.stripe_account,
    refresh_url: `${base}/api/stripe/account/refresh?address=${address}`,
    return_url:  `${base}/stripe/return`,
    type:        'account_onboarding',
  })

  return NextResponse.redirect(link.url)
}
