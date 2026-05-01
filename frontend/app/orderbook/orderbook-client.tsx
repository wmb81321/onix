'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createClient, type Order } from '@/lib/supabase'
import { PlaceOrderModal } from '@/components/place-order-modal'

type Filter = 'all' | 'buy' | 'sell'

export function OrderBookClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders,     setOrders]     = useState<Order[]>(initialOrders)
  const [filter,     setFilter]     = useState<Filter>('all')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [matching,   setMatching]   = useState<string | null>(null)
  const [matchError, setMatchError] = useState<string | null>(null)
  const { address }  = useAccount()
  const router       = useRouter()
  const supabase     = createClient()

  // Supabase Realtime — open orders
  useEffect(() => {
    const channel = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'status=eq.open' }, (payload) => {
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
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [supabase])

  async function matchOrder(order: Order) {
    if (!address) { setMatchError('Connect your wallet to match orders'); return }
    if (order.user_address === address) { setMatchError('Cannot match your own order'); return }

    setMatching(order.id)
    setMatchError(null)

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id:       order.id,
          buyer_address:  address,
          seller_address: order.user_address,
          usdc_amount:    order.usdc_amount,
          usd_amount:     order.usd_amount,
        }),
      })
      const data = await res.json() as { trade_id?: string; error?: string }
      if (!res.ok) { setMatchError(data.error ?? 'Failed to create trade'); return }
      router.push(`/trades/${data.trade_id}`)
    } catch {
      setMatchError('Network error — please try again')
    } finally {
      setMatching(null)
    }
  }

  const visible = orders.filter((o) => filter === 'all' || o.type === filter)
  const buys    = orders.filter((o) => o.type === 'buy').length
  const sells   = orders.filter((o) => o.type === 'sell').length

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'all',  label: 'All',  count: orders.length },
    { key: 'buy',  label: 'Buy',  count: buys  },
    { key: 'sell', label: 'Sell', count: sells },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-panel rounded-lg border border-white/[0.07]">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs transition-colors ${
                filter === key
                  ? key === 'sell'
                    ? 'bg-accent/15 text-accent font-semibold'
                    : key === 'buy'
                      ? 'bg-caution/15 text-caution font-semibold'
                      : 'bg-white/[0.08] text-ink font-semibold'
                  : 'text-dim hover:text-ink'
              }`}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-white/10' : 'bg-white/[0.05]'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* New order button */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-canvas rounded-lg font-mono text-xs font-semibold hover:bg-accent-2 transition-colors"
        >
          <span className="text-sm leading-none">+</span>
          New Order
        </button>
      </div>

      {/* Error */}
      {matchError && (
        <div className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-4 py-2.5">
          {matchError}
        </div>
      )}

      {/* Orders table */}
      <div className="rounded-xl border border-white/[0.07] bg-panel overflow-hidden">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="font-mono text-[11px] text-dim/40 uppercase tracking-widest">
              No {filter === 'all' ? '' : filter} orders
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="font-mono text-[11px] text-accent/60 hover:text-accent transition-colors mt-1"
            >
              Place the first one →
            </button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-4 py-3 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USDC</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USD</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] text-dim/50 uppercase tracking-widest">Rate</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const isOwn      = o.user_address === address
                const isSell     = o.type === 'sell'
                const isMatching = matching === o.id
                return (
                  <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${isSell ? 'text-accent' : 'text-caution'}`}>
                        {o.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink/80">{Number(o.usdc_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-ink/80">${Number(o.usd_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-dim text-right">{Number(o.rate).toFixed(4)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {isOwn ? (
                        <span className="font-mono text-[10px] text-dim/40">yours</span>
                      ) : isSell ? (
                        <button
                          onClick={() => matchOrder(o)}
                          disabled={isMatching || !address}
                          className="px-3 py-1 rounded-md bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-widest hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isMatching ? '…' : 'Match'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <PlaceOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setFilter('all')}
      />
    </>
  )
}
