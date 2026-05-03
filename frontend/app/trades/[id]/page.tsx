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

  // Prefer the payment methods snapshotted on the order at creation time (migration 008).
  // Fall back to the seller's current profile in case of older orders without the snapshot.
  const { data: matchedOrder } = await db
    .from('orders')
    .select('seller_payment_methods')
    .eq('id', trade.order_id)
    .single()

  let sellerPaymentMethods: Array<{ type: string; label: string; value: string }> =
    (matchedOrder?.seller_payment_methods ?? []) as Array<{ type: string; label: string; value: string }>

  if (sellerPaymentMethods.length === 0) {
    const { data: sellerUser } = await db
      .from('users')
      .select('payment_methods')
      .eq('address', trade.seller_address)
      .single()
    sellerPaymentMethods = (sellerUser?.payment_methods ?? []) as typeof sellerPaymentMethods
  }

  return (
    <TradeDetail
      initialTrade={trade}
      sellerPaymentMethods={sellerPaymentMethods}
    />
  )
}
