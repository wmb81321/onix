'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWalletClient } from 'wagmi'
import { Mppx as MppxClient, tempo as mppxTempo } from 'mppx/client'
import { createClient, type Order } from '@/lib/supabase'
import { PlaceOrderModal } from '@/components/place-order-modal'

type Filter = 'all' | 'buy' | 'sell'

export function OrderBookClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders,      setOrders]      = useState<Order[]>(initialOrders)
  const [filter,      setFilter]      = useState<Filter>('all')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [matching,    setMatching]    = useState<string | null>(null)
  const [cancelling,  setCancelling]  = useState<string | null>(null)
  const [matchError,  setMatchError]  = useState<string | null>(null)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [noPayMethod, setNoPayMethod] = useState(false)
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const router      = useRouter()
  // Stable client — createClient() must not be called on every render or the
  // Realtime subscription is torn down and re-created constantly.
  const supabase    = useMemo(() => createClient(), [])

  // Merge server orders with any locally-injected ones so a router.refresh() race
  // doesn't erase an order that was just created but hasn't propagated to the server
  // query yet.
  useEffect(() => {
    setOrders((prev) => {
      const serverIds = new Set(initialOrders.map((o) => o.id))
      const extra = prev.filter((o) => !serverIds.has(o.id))
      return [...initialOrders, ...extra].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    })
  }, [initialOrders])

  // Supabase Realtime — all order changes, filtered client-side to avoid ENUM matching issues
  useEffect(() => {
    const channel = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const order = payload.new as Order
          if (order.status === 'open') {
            setOrders((prev) => {
              if (prev.some((o) => o.id === order.id)) return prev
              return [order, ...prev]
            })
          }
        }
        if (payload.eventType === 'UPDATE') {
          const order = payload.new as Order
          setOrders((prev) =>
            prev
              .map((o) => (o.id === order.id ? order : o))
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

  // When user has a SELL order open and no payment methods, warn once
  useEffect(() => {
    if (!address) return
    const hasSell = orders.some((o) => o.user_address.toLowerCase() === address.toLowerCase() && o.type === 'sell')
    if (!hasSell) { setNoPayMethod(false); return }
    void fetch(`/api/users/me?address=${address}`)
      .then((r) => r.json())
      .then((d: { payment_methods?: unknown[] }) => {
        setNoPayMethod(!d.payment_methods?.length)
      })
      .catch(() => {})
  }, [address, orders])

  async function handleOrderCreated(orderId: string) {
    // Fetch the just-created order and inject it immediately — don't wait for Realtime
    try {
      const res = await fetch(`/api/orders?id=${orderId}`)
      if (res.ok) {
        const order = await res.json() as Order
        setOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev
          return [order, ...prev]
        })
      }
    } catch { /* Realtime will catch it if this fails */ }
    setFilter('all')
    router.refresh()
  }

  async function matchOrder(order: Order) {
    if (!address)      { setMatchError('Connect your wallet to match orders'); return }
    if (!walletClient) { setMatchError('Wallet not ready — try again'); return }
    if (order.user_address.toLowerCase() === address.toLowerCase()) {
      setMatchError('Cannot match your own order')
      return
    }

    setMatching(order.id)
    setMatchError(null)

    const buyerAddress  = order.type === 'sell' ? address            : order.user_address
    const sellerAddress = order.type === 'sell' ? order.user_address : address

    try {
      // Taker pays 0.1 USDC service fee via mppx x402 (same push-mode pattern as order creation)
      const mppx = MppxClient.create({
        methods: [mppxTempo.charge({
          getClient: () => walletClient as never,
          mode: 'push',
        })],
        polyfill: false,
      })

      const res = await mppx.fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id:       order.id,
          buyer_address:  buyerAddress,
          seller_address: sellerAddress,
          usdc_amount:    order.usdc_amount,
          usd_amount:     order.usd_amount,
        }),
      })
      const data = await res.json() as { trade_id?: string; error?: string }
      if (!res.ok) { setMatchError(data.error ?? 'Failed to create trade'); return }
      router.push(`/trades/${data.trade_id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setMatchError('Payment cancelled')
      } else {
        setMatchError('Network error — please try again')
      }
    } finally {
      setMatching(null)
    }
  }

  async function cancelOrder(order: Order) {
    if (!address) return
    setCancelling(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: address }),
      })
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id))
        setExpandedId(null)
      } else {
        const d = await res.json() as { error?: string }
        setMatchError(d.error ?? 'Cancel failed')
      }
    } catch {
      setMatchError('Network error — please try again')
    } finally {
      setCancelling(null)
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

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-canvas rounded-lg font-mono text-xs font-semibold hover:bg-accent-2 transition-colors"
        >
          <span className="text-sm leading-none">+</span>
          New Order
        </button>
      </div>

      {/* Payment method warning */}
      {noPayMethod && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-caution/5 border border-caution/20">
          <p className="font-mono text-xs text-caution/80">
            You have an open SELL order but no payment methods set — buyers won&apos;t know how to pay you.
          </p>
          <a
            href="/account"
            className="shrink-0 font-mono text-[10px] text-caution hover:text-caution/80 transition-colors underline underline-offset-2"
          >
            Add methods →
          </a>
        </div>
      )}

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
                const isOwn      = address && o.user_address.toLowerCase() === address.toLowerCase()
                const isSell     = o.type === 'sell'
                const isMatching = matching === o.id
                const isExpanded = expandedId === o.id
                return (
                  <>
                    <tr
                      key={o.id}
                      className={`border-b border-white/[0.04] transition-colors ${isOwn ? 'cursor-pointer hover:bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                      onClick={() => isOwn && setExpandedId(isExpanded ? null : o.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${isSell ? 'text-accent' : 'text-caution'}`}>
                            {o.type}
                          </span>
                          {isOwn && (
                            <span className="font-mono text-[9px] text-dim/40 border border-white/[0.06] rounded px-1">
                              yours
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink/80">{Number(o.usdc_amount).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-ink/80">${Number(o.usd_amount).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-dim text-right">{Number(o.rate).toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-right">
                        {isOwn ? (
                          <span className="font-mono text-[10px] text-dim/40">{isExpanded ? '▲' : '▼'}</span>
                        ) : (
                          <button
                            onClick={() => matchOrder(o)}
                            disabled={isMatching || !address}
                            className={`px-3 py-1 rounded-md font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              isSell
                                ? 'bg-accent/10 text-accent hover:bg-accent/20'
                                : 'bg-caution/10 text-caution hover:bg-caution/20'
                            }`}
                          >
                            {isMatching ? '…' : isSell ? 'Buy' : 'Sell'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOwn && isExpanded && (
                      <tr key={`${o.id}-detail`} className="border-b border-white/[0.04] bg-white/[0.015]">
                        <td colSpan={5} className="px-4 py-3 space-y-2">
                          {o.virtual_deposit_address && (
                            <div className="flex items-start gap-3">
                              <span className="font-mono text-[10px] text-dim/50 uppercase tracking-widest shrink-0 mt-0.5">Deposit VA</span>
                              <span className="font-mono text-[11px] text-dim break-all">{o.virtual_deposit_address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); void cancelOrder(o) }}
                              disabled={cancelling === o.id}
                              className="px-3 py-1 rounded-md font-mono text-[10px] text-danger/70 border border-danger/20 hover:bg-danger/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {cancelling === o.id ? 'Cancelling…' : 'Cancel order'}
                            </button>
                            <span className="font-mono text-[10px] text-dim/30">Fee forfeited on cancel</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <PlaceOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleOrderCreated}
      />
    </>
  )
}
