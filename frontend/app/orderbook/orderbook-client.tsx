'use client'

import { useEffect, useState } from 'react'
import { createClient, type Order } from '@/lib/supabase'

export function OrderBookClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const supabase = createClient()

  // Real-time subscription — Supabase Realtime pushes inserts/updates/deletes
  useEffect(() => {
    const channel = supabase
      .channel('orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: "status=eq.open" },
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
    <div className="grid grid-cols-2 gap-6">
      <OrderSide title="Buy orders" orders={buys}  color="text-green-400" />
      <OrderSide title="Sell orders" orders={sells} color="text-red-400"   />
    </div>
  )
}

function OrderSide({
  title,
  orders,
  color,
}: {
  title: string
  orders: Order[]
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className={`font-medium ${color}`}>{title}</span>
        <span className="text-xs text-gray-500">{orders.length} open</span>
      </div>
      {orders.length === 0 ? (
        <p className="px-4 py-8 text-center text-gray-600 text-sm">No orders yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="px-4 py-2 text-left">USDC</th>
              <th className="px-4 py-2 text-left">USD</th>
              <th className="px-4 py-2 text-right">Rate</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-900 hover:bg-gray-900 cursor-pointer">
                <td className="px-4 py-2 font-mono">{o.usdc_amount.toFixed(2)}</td>
                <td className="px-4 py-2 font-mono">${o.usd_amount.toFixed(2)}</td>
                <td className="px-4 py-2 font-mono text-right text-gray-400">{o.rate.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
