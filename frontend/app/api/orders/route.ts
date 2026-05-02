import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'

type OrderStatus = Database['public']['Enums']['order_status']
type OrderType   = Database['public']['Enums']['order_type']

export async function GET(req: NextRequest) {
  const type   = req.nextUrl.searchParams.get('type')
  const status = (req.nextUrl.searchParams.get('status') ?? 'open') as OrderStatus
  const id     = req.nextUrl.searchParams.get('id')

  const db = createServerClient()

  if (id) {
    const { data, error } = await db.from('orders').select('*').eq('id', id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  }

  let query = db.from('orders').select('*').eq('status', status).order('created_at', { ascending: false })
  if (type && type !== 'all') query = query.eq('type', type as OrderType)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const MIN_USDC = 5

const schema = z.object({
  user_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  type:         z.enum(['buy', 'sell']),
  usdc_amount:  z.number().min(MIN_USDC, `Minimum order is ${MIN_USDC} USDC`),
  rate:         z.number().positive('Rate must be positive'),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { user_address, type, usdc_amount, rate } = parsed.data
  const usd_amount = Math.round(usdc_amount * rate * 100) / 100

  const db = createServerClient()

  // Ensure user row exists before inserting order (prevents FK violation on first order)
  await db
    .from('users')
    .upsert({ address: user_address }, { onConflict: 'address', ignoreDuplicates: true })

  const { data, error } = await db
    .from('orders')
    .insert({ user_address, type, usdc_amount, usd_amount, rate })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
