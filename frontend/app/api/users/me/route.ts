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
    .select('payment_methods, rating_avg, trade_count')
    .eq('address', address)
    .single()

  if (error || !data) {
    return NextResponse.json({ payment_methods: [], rating_avg: 0, trade_count: 0 })
  }

  return NextResponse.json(data)
}
