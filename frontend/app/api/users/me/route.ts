import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  const db = createServerClient()
  const { data, error } = await db
    .from('users')
    .select('stripe_buyer_card_brand, stripe_buyer_card_last4, stripe_customer_id, stripe_buyer_pm_id, link_payment_method_id')
    .eq('address', address)
    .single()

  if (error || !data) {
    return NextResponse.json({})
  }

  return NextResponse.json(data)
}
