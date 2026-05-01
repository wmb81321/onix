'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Hooks } from 'wagmi/tempo'
import { formatUnits } from 'viem'
import Link from 'next/link'
import { StripeConnectButton } from '@/components/stripe-connect-button'
import type { Order, Trade } from '@/lib/supabase'

import { PATHUSDC, useTokenSymbol } from '@/components/balance-display'

export function AccountClient() {
  const { address, isConnected } = useAccount()
  const [orders, setOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)

  const symbol = useTokenSymbol()

  const { data: balanceRaw, refetch: refetchBalance } = Hooks.token.useGetBalance({
    account: address,
    token:   PATHUSDC,
    query:   { enabled: !!address },
  })
  const balance = balanceRaw !== undefined
    ? Number(formatUnits(balanceRaw as bigint, 6)).toFixed(2)
    : null

  const { mutate: fund, isPending: funding } = Hooks.faucet.useFundSync({
    mutation: {
      onSuccess: () => { void refetchBalance() },
    },
  })

  useEffect(() => {
    if (!address) return
    setLoading(true)

    Promise.all([
      fetch(`/api/orders/by-user?address=${address}`).then((r) => r.json() as Promise<Order[]>),
      fetch(`/api/trades/by-user?address=${address}`).then((r) => r.json() as Promise<Trade[]>),
    ]).then(([ordersData, tradesData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setTrades(Array.isArray(tradesData) ? tradesData : [])
    }).catch(() => {
      setOrders([])
      setTrades([])
    }).finally(() => setLoading(false))
  }, [address])

  function copyAddress() {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <span className="font-mono text-xs text-dim">Connect your wallet to view your account</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-ink tracking-tight">Account</h2>
        <p className="text-[12px] font-mono text-dim mt-0.5">wallet · balance · payments</p>
      </div>

      {/* Wallet + Balance */}
      <div className="bg-panel rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Wallet</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink/70">
              {address?.slice(0, 10)}…{address?.slice(-8)}
            </span>
            <button
              onClick={copyAddress}
              className="font-mono text-[10px] text-accent/60 hover:text-accent transition-colors"
            >
              {copied ? 'copied!' : 'copy'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest">{symbol} Balance</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-ink">
              {balance !== null
                ? <><span className="text-ink/70">{balance}</span> <span className="text-dim/50">{symbol}</span></>
                : <span className="text-dim/40">···</span>
              }
            </span>
            <button
              onClick={() => address && fund({ account: address })}
              disabled={funding || !address}
              className="font-mono text-[10px] text-accent/60 hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Get test USDC from Tempo faucet"
            >
              {funding ? 'funding…' : '+ testnet'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Stripe payout</span>
          <StripeConnectButton />
        </div>

        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Stripe Link</span>
          <span className="font-mono text-[10px] text-dim/40 italic">coming soon — needed to buy</span>
        </div>
      </div>

      {/* Deposit / Withdraw */}
      <div className="bg-panel rounded-xl border border-white/[0.07] p-4 space-y-3">
        <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Deposit · Withdraw</span>
        <p className="font-mono text-xs text-dim/70 leading-relaxed">
          USDC lives on Tempo. Bridge in from any chain or fund directly via Tempo Wallet. Use "+ testnet" above for instant testnet funds.
        </p>
        <a
          href="https://wallet.tempo.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 font-mono text-xs text-dim hover:border-white/20 hover:text-ink transition-colors"
        >
          Open Tempo Wallet →
        </a>
      </div>

      {/* Open orders */}
      <Section title="My Orders" count={orders.filter(o => o.status === 'open').length} loading={loading}>
        {orders.length === 0 ? (
          <Empty text="No orders yet" />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">Type</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USDC</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">Rate</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/[0.04]">
                  <td className="px-4 py-2.5">
                    <span className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${o.type === 'sell' ? 'text-accent' : 'text-caution'}`}>
                      {o.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-ink/80">{Number(o.usdc_amount).toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-dim">{Number(o.rate).toFixed(4)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${o.status === 'open' ? 'text-accent' : 'text-dim/50'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Trade history */}
      <Section title="Trade History" count={trades.length} loading={loading}>
        {trades.length === 0 ? (
          <Empty text="No trades yet" />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">Role</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USDC</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">USD</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] text-dim/50 uppercase tracking-widest">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const role = t.buyer_address.toLowerCase() === address?.toLowerCase() ? 'buyer' : 'seller'
                const statusColor = t.status === 'complete' ? 'text-accent'
                  : t.status === 'released' ? 'text-accent/70'
                  : ['deposit_timeout','stripe_failed','refunded'].includes(t.status) ? 'text-danger/70'
                  : 'text-caution'
                return (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`font-mono text-[10px] uppercase tracking-widest font-semibold ${role === 'seller' ? 'text-accent' : 'text-caution'}`}>
                        {role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-ink/80">{Number(t.usdc_amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-mono text-ink/80">${Number(t.usd_amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${statusColor}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/trades/${t.id}`}
                        className="font-mono text-[10px] text-dim/50 hover:text-accent transition-colors"
                      >
                        view →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Section>

    </div>
  )
}

function Section({
  title, count, loading, children,
}: {
  title: string
  count: number
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
        <span className="font-mono text-xs font-medium text-ink/80 tracking-wide">{title}</span>
        <span className="font-mono text-[11px] text-dim">
          {loading ? '…' : count}
        </span>
      </div>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="px-4 py-8 flex items-center justify-center">
      <span className="font-mono text-[11px] text-dim/40 uppercase tracking-widest">{text}</span>
    </div>
  )
}
