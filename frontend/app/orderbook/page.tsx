import { createClient } from '@/lib/supabase'
import type { Order } from '@/lib/supabase'
import { OrderBookClient } from './orderbook-client'

// Server component — initial data fetch; real-time updates in the client component
export default async function OrderBookPage() {
  const supabase = createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Order Book</h2>
        <span className="text-sm text-gray-400">Live · Tempo testnet</span>
      </div>
      <OrderBookClient initialOrders={(orders as Order[]) ?? []} />
    </div>
  )
}
