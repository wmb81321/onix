import { createServerClient } from '@/lib/supabase-server'
import type { Order } from '@/lib/supabase'
import { OrderBookClient } from './orderbook-client'

export default async function OrderBookPage() {
  const supabase = createServerClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink tracking-tight">Order Book</h2>
          <p className="text-[12px] font-mono text-dim mt-0.5">open orders · realtime</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/[0.05]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[11px] text-accent tracking-wider">LIVE</span>
        </div>
      </div>
      <OrderBookClient initialOrders={(orders as Order[]) ?? []} />
    </div>
  )
}
