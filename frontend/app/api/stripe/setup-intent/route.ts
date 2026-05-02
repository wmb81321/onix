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

  const { data: user } = await db
    .from('users')
    .select('stripe_customer_id')
    .eq('address', user_address)
    .single()

  let customerId = user?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { wallet_address: user_address },
    })
    customerId = customer.id

    await db
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('address', user_address)
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}
