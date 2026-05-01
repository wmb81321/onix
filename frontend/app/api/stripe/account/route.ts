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

  const host  = req.headers.get('host') ?? 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const base  = `${proto}://${host}`

  // If already connected, generate a fresh onboarding link in case setup is incomplete
  const { data: user } = await db
    .from('users')
    .select('stripe_account')
    .eq('address', user_address)
    .single()

  if (user?.stripe_account) {
    const account = await stripe.accounts.retrieve(user.stripe_account)

    // Already fully onboarded — nothing to do
    if (account.details_submitted) {
      return NextResponse.json({
        account_id:        account.id,
        details_submitted: true,
        onboarding_url:    null,
      })
    }

    // Onboarding started but incomplete — return a fresh link to continue
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

  // Create a new Express Connect account.
  // - No country: Stripe's onboarding collects it from the user (supports all markets).
  // - No capabilities: pre-requesting 'transfers' requires recipient service agreement
  //   acceptance which can only happen during hosted onboarding, not at creation time.
  const account = await stripe.accounts.create({
    type:     'express',
    metadata: { wallet_address: user_address },
  })

  // Persist immediately so the agent can find this account by wallet address
  await db
    .from('users')
    .update({ stripe_account: account.id })
    .eq('address', user_address)

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
