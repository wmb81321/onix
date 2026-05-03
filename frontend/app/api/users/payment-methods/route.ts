import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const PaymentMethod = z.object({
  type:  z.string().min(1).max(30),
  label: z.string().min(1).max(60),
  value: z.string().min(1).max(200),
})

const Body = z.object({
  address:         z.string().regex(/^0x[0-9a-fA-F]{40}$/i),
  payment_methods: z.array(PaymentMethod).max(10),
})

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { address, payment_methods } = parsed.data
  const db = createServerClient()

  await db
    .from('users')
    .upsert({ address }, { onConflict: 'address', ignoreDuplicates: true })

  const { error } = await db
    .from('users')
    .update({ payment_methods })
    .eq('address', address)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
