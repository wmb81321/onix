import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const db = createServerClient()

  const { data, error } = await db
    .from('trades')
    .select('*')
    .eq('id', id)
    .single()

  if (error ?? !data) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
