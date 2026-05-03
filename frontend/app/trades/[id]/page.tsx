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

  const trade = data as Trade

  // Fetch seller's payment methods to show buyer where to send funds
  const { data: sellerUser } = await db
    .from('users')
    .select('payment_methods')
    .eq('address', trade.seller_address)
    .single()

  const sellerPaymentMethods = (sellerUser?.payment_methods ?? []) as Array<{
    type: string
    label: string
    value: string
  }>

  return (
    <TradeDetail
      initialTrade={trade}
      sellerPaymentMethods={sellerPaymentMethods}
    />
  )
}
