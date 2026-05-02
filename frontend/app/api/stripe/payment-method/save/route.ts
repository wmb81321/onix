import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.preview' as Stripe.LatestApiVersion,
})

const schema = z.object({
  user_address:       z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  payment_method_id:  z.string().startsWith('pm_'),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { user_address, payment_method_id } = parsed.data

  const pm = await stripe.paymentMethods.retrieve(payment_method_id)
  const brand  = pm.card?.brand  ?? null
  const last4  = pm.card?.last4  ?? null

  const db = createServerClient()
  await db
    .from('users')
    .update({
      stripe_buyer_pm_id:    payment_method_id,
      stripe_buyer_card_brand: brand,
      stripe_buyer_card_last4: last4,
    })
    .eq('address', user_address)

  return NextResponse.json({ ok: true, brand, last4 })
}
