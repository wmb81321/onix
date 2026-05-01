import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid address' }, { status: 400 })
  }

  const { address } = parsed.data
  const db = createServerClient()

  // ignoreDuplicates: true — only inserts on first connect; never overwrites
  // existing data (stripe_account, rating_avg, etc.) on subsequent connects.
  const { error: upsertError } = await db
    .from('users')
    .upsert({ address }, { onConflict: 'address', ignoreDuplicates: true })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const { data, error: fetchError } = await db
    .from('users')
    .select()
    .eq('address', address)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
