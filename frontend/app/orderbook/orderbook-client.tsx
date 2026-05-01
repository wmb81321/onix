'use client'

import { useEffect, useState } from 'react'
import { createClient, type Order } from '@/lib/supabase'

export function OrderBookClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: 'status=eq.open' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as Order, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev
                .map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
                .filter((o) => o.status === 'open'),
            )
          }
          if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as Order).id))
          }
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [supabase])

  const buys  = orders.filter((o) => o.type === 'buy')
  const sells = orders.filter((o) => o.type === 'sell')

  return (
    <div className="grid grid-cols-2 gap-4">
      <OrderSide title="Bids" side="buy"  orders={buys}  />
      <OrderSide title="Asks" side="sell" orders={sells} />
    </div>
  )
}

function OrderSide({
  title,
  side,
  orders,
}: {
  title: string
  side: 'buy' | 'sell'
  orders: Order[]
}) {
  const accent = side === 'buy' ? 'text-accent' : 'text-caution'
  const dot    = side === 'buy' ? 'bg-accent'   : 'bg-caution'

  return (
    <div className="rounded-xl border border-white/[0.07] bg-panel overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className={`font-mono text-xs font-medium ${accent} tracking-widest uppercase`}>
            {title}
          </span>
        </div>
        <span className="font-mono text-[11px] text-dim">
          {orders.length} open
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="px-4 py-10 flex flex-col items-center gap-2">
          <span className="font-mono text-[11px] text-dim/50 uppercase tracking-widest">
            no orders
          </span>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/60 uppercase tracking-widest">
                USDC
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/60 uppercase tracking-widest">
                USD
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] text-dim/60 uppercase tracking-widest">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.025] cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-ink/80">
                  {o.usdc_amount.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 font-mono text-ink/80">
                  ${o.usd_amount.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 font-mono text-dim text-right">
                  {o.rate.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
