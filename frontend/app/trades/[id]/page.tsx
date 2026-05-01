import { createServerClient } from '@/lib/supabase-server'
import type { Trade } from '@/lib/supabase'
import { TradeDetail } from './trade-detail'
import { notFound } from 'next/navigation'

export default async function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServerClient()

  const { data, error } = await db
    .from('trades')
    .select('*')
    .eq('id', id)
    .single()

  if (error ?? !data) notFound()

  return <TradeDetail initialTrade={data as Trade} />
}
