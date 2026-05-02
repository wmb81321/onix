import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  user_address:           z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  link_payment_method_id: z.string().startsWith('csmrpd_'),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'link_payment_method_id must start with csmrpd_' },
      { status: 400 },
    )
  }

  const { user_address, link_payment_method_id } = parsed.data
  const db = createServerClient()

  const { error } = await db
    .from('users')
    .update({ link_payment_method_id })
    .eq('address', user_address)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  const db = createServerClient()
  await db.from('users').update({ link_payment_method_id: null }).eq('address', address)
  return NextResponse.json({ ok: true })
}
