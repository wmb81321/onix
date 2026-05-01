'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createClient, type Order } from '@/lib/supabase'
import { PlaceOrderModal } from '@/components/place-order-modal'

export function OrderBookClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders,      setOrders]      = useState<Order[]>(initialOrders)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [matching,    setMatching]    = useState<string | null>(null)
  const [matchError,  setMatchError]  = useState<string | null>(null)
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

  const buys  = orders.filter((o) => o.type === 'buy')
  const sells = orders.filter((o) => o.type === 'sell')

  return (
    <>
      {matchError && (
        <div className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-4 py-2.5">
          {matchError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <OrderSide title="Bids" side="buy"  orders={buys}  onMatch={matchOrder} matching={matching} address={address} />
        <OrderSide title="Asks" side="sell" orders={sells} onMatch={matchOrder} matching={matching} address={address} />
      </div>

      {/* Floating new order button */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-4 py-2.5 bg-accent text-canvas rounded-xl font-mono text-sm font-semibold hover:bg-accent-2 transition-colors shadow-lg shadow-accent/10"
      >
        <span className="text-base leading-none">+</span> New Order
      </button>

      <PlaceOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          console.log('[orderbook] order created:', id)
        }}
      />
    </>
  )
}

function OrderSide({
  title, side, orders, onMatch, matching, address,
}: {
  title: string
  side: 'buy' | 'sell'
  orders: Order[]
  onMatch: (o: Order) => void
  matching: string | null
  address: string | undefined
}) {
  const accent = side === 'buy' ? 'text-accent'   : 'text-caution'
  const dot    = side === 'buy' ? 'bg-accent'     : 'bg-caution'
  const matchSide = side === 'sell'  // buyers match sell orders

  return (
    <div className="rounded-xl border border-white/[0.07] bg-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className={`font-mono text-xs font-medium ${accent} tracking-widest uppercase`}>
            {title}
          </span>
        </div>
        <span className="font-mono text-[11px] text-dim">{orders.length} open</span>
      </div>

      {orders.length === 0 ? (
        <div className="px-4 py-10 flex flex-col items-center gap-2">
          <span className="font-mono text-[11px] text-dim/40 uppercase tracking-widest">
            no orders
          </span>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USDC</th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USD</th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] text-dim/50 uppercase tracking-widest">Rate</th>
              {matchSide && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isOwn = o.user_address === address
              const isMatching = matching === o.id
              return (
                <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 font-mono text-ink/80">{o.usdc_amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-ink/80">${o.usd_amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-dim text-right">{o.rate.toFixed(4)}</td>
                  {matchSide && (
                    <td className="px-3 py-2 text-right">
                      {!isOwn && (
                        <button
                          onClick={() => onMatch(o)}
                          disabled={isMatching || !address}
                          className="px-2.5 py-1 rounded-md bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-widest hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isMatching ? '…' : 'Match'}
                        </button>
                      )}
                      {isOwn && (
                        <span className="font-mono text-[10px] text-dim/40">yours</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
