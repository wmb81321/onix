import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

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
