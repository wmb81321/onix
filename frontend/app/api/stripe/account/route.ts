import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.preview' as Stripe.LatestApiVersion,
})

const schema = z.object({
  user_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  const { user_address } = parsed.data
  const db = createServerClient()

  // If already connected, return existing account
  const { data: user } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', user_address)
    .single()

  if (user?.stripe_account) {
    // Retrieve live status from Stripe
    const account = await stripe.accounts.retrieve(user.stripe_account)
    return NextResponse.json({
      account_id:    account.id,
      details_submitted: account.details_submitted,
      onboarding_url: null,
    })
  }

  // Create a new Express Connect account for the seller
  const account = await stripe.accounts.create({
    type:    'express',
    country: 'CO',
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { wallet_address: user_address },
  })

  // Persist the account ID immediately so the agent can find it later
  await db
    .from('users')
    .update({ stripe_account: account.id })
    .eq('address', user_address)

  // Build base URL from request headers
  const host  = req.headers.get('host') ?? 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const base  = `${proto}://${host}`

  const link = await stripe.accountLinks.create({
    account:     account.id,
    refresh_url: `${base}/api/stripe/account/refresh?address=${user_address}`,
    return_url:  `${base}/stripe/return`,
    type:        'account_onboarding',
  })

  return NextResponse.json({
    account_id:        account.id,
    details_submitted: false,
    onboarding_url:    link.url,
  })
}
