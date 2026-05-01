'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import type { Trade, TradeStatus } from '@/lib/supabase'

const STEPS: TradeStatus[] = [
  'created', 'deposited', 'fee_paid', 'fiat_sent', 'released', 'complete',
]

const STEP_LABELS: Record<TradeStatus, string> = {
  created:         'Trade created',
  deposited:       'USDC deposited',
  fee_paid:        'Service fee paid',
  fiat_sent:       'Fiat sent to seller',
  released:        'USDC released to buyer',
  complete:        'Trade complete',
  deposit_timeout: 'Deposit timed out',
  stripe_failed:   'Stripe payment failed',
  refunded:        'Refunded',
}

const FAILED: TradeStatus[] = ['deposit_timeout', 'stripe_failed', 'refunded']

export function TradeDetail({ initialTrade }: { initialTrade: Trade }) {
  const [trade,     setTrade]     = useState<Trade>(initialTrade)
  const [settling,  setSettling]  = useState(false)
  const [settleErr, setSettleErr] = useState<string | null>(null)
  const [copied,    setCopied]    = useState(false)
  const { address } = useAccount()

  const isSeller = address?.toLowerCase() === trade.seller_address.toLowerCase()
  const isBuyer  = address?.toLowerCase() === trade.buyer_address.toLowerCase()
  const isFailed = FAILED.includes(trade.status)

  // Poll for status updates every 5s
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/trades/${trade.id}`)
      if (!res.ok) return
      const data = await res.json() as Trade
      setTrade(data)
    } catch { /* ignore */ }
  }, [trade.id])

  useEffect(() => {
    if (trade.status === 'complete' || isFailed) return
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [trade.status, isFailed, poll])

  async function settle() {
    setSettling(true)
    setSettleErr(null)
    try {
      const res = await fetch(`/api/trades/${trade.id}/settle`, { method: 'POST' })
      const data = await res.json() as { status?: string; error?: string }
      if (!res.ok) { setSettleErr(data.error ?? 'Settlement failed'); return }
      await poll()
    } catch {
      setSettleErr('Network error — please try again')
    } finally {
      setSettling(false)
    }
  }

  function copyAddress() {
    void navigator.clipboard.writeText(trade.virtual_deposit_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeStep = STEPS.indexOf(trade.status)

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Trade</h2>
          <p className="font-mono text-[11px] text-dim mt-0.5">{trade.id}</p>
        </div>
        <StatusBadge status={trade.status} />
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
        <InfoCell label="USDC" value={`${trade.usdc_amount.toFixed(2)}`} accent />
        <InfoCell label="USD"  value={`$${trade.usd_amount.toFixed(2)}`} />
        <InfoCell label="Rate" value={(trade.usd_amount / trade.usdc_amount).toFixed(4)} />
      </div>

      {/* Parties */}
      <div className="bg-panel rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
        <PartyRow label="Seller" address={trade.seller_address} you={isSeller} />
        <PartyRow label="Buyer"  address={trade.buyer_address}  you={isBuyer}  />
      </div>

      {/* Progress */}
      {!isFailed && (
        <div className="bg-panel rounded-xl border border-white/[0.07] p-4 space-y-3">
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Progress</span>
          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const done    = i < activeStep
              const current = i === activeStep
              const future  = i > activeStep
              return (
                <div key={step} className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    done    ? 'border-accent bg-accent/20 text-accent'
                    : current ? 'border-accent text-accent'
                    : 'border-white/10 text-dim/30'
                  }`}>
                    {done ? '✓' : current ? '●' : '○'}
                  </span>
                  <span className={`font-mono text-xs ${
                    done ? 'text-dim' : current ? 'text-ink' : 'text-dim/40'
                  }`}>
                    {STEP_LABELS[step]}
                  </span>
                  {current && <span className="font-mono text-[10px] text-accent/60 ml-auto">now</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isFailed && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 font-mono text-xs text-danger/80">
          {STEP_LABELS[trade.status]}
        </div>
      )}

      {/* Seller: deposit instructions */}
      {isSeller && trade.status === 'created' && (
        <div className="bg-panel rounded-xl border border-accent/20 p-4 space-y-3">
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
            Action required · Deposit USDC
          </span>
          <p className="font-mono text-xs text-dim leading-relaxed">
            Send exactly{' '}
            <span className="text-ink">{trade.usdc_amount.toFixed(2)} USDC</span>{' '}
            to your virtual deposit address. Funds auto-forward to the agent.
          </p>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-canvas rounded-lg border border-white/[0.07]">
            <span className="font-mono text-xs text-ink/70 flex-1 truncate">
              {trade.virtual_deposit_address}
            </span>
            <button
              onClick={copyAddress}
              className="font-mono text-[10px] text-accent/70 hover:text-accent transition-colors shrink-0"
            >
              {copied ? 'copied!' : 'copy'}
            </button>
          </div>
          <p className="font-mono text-[10px] text-dim/40">
            Deadline: {new Date(trade.deposit_deadline).toLocaleString()}
          </p>
        </div>
      )}

      {/* Buyer: settle button */}
      {isBuyer && trade.status === 'deposited' && (
        <div className="bg-panel rounded-xl border border-white/[0.07] p-4 space-y-3">
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest">
            USDC deposited · Ready to settle
          </span>
          <p className="font-mono text-xs text-dim leading-relaxed">
            The seller has deposited USDC. Initiate settlement to pay the 0.1 USDC service
            fee and trigger the fiat payout to the seller.
          </p>
          {settleErr && (
            <p className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/15 rounded-lg px-3 py-2">
              {settleErr}
            </p>
          )}
          <button
            onClick={settle}
            disabled={settling}
            className="w-full py-2.5 rounded-lg bg-accent text-canvas font-mono text-sm font-semibold hover:bg-accent-2 transition-colors disabled:opacity-40"
          >
            {settling ? 'Initiating…' : 'Settle Trade'}
          </button>
        </div>
      )}

      {/* Waiting state for buyer before deposit */}
      {isBuyer && trade.status === 'created' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-panel rounded-xl border border-white/[0.07]">
          <span className="w-1.5 h-1.5 rounded-full bg-caution animate-pulse shrink-0" />
          <span className="font-mono text-xs text-dim">
            Waiting for seller to deposit {trade.usdc_amount.toFixed(2)} USDC…
          </span>
        </div>
      )}

    </div>
  )
}

function StatusBadge({ status }: { status: TradeStatus }) {
  const color = status === 'complete'   ? 'text-accent border-accent/30 bg-accent/5'
    : FAILED.includes(status)           ? 'text-danger border-danger/30 bg-danger/5'
    : 'text-caution border-caution/30 bg-caution/5'

  return (
    <span className={`px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-widest ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 px-3 bg-panel">
      <span className={`font-mono text-base font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </span>
      <span className="font-mono text-[10px] text-dim uppercase tracking-widest">{label}</span>
    </div>
  )
}

function PartyRow({ label, address, you }: { label: string; address: string; you: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-dim uppercase tracking-widest w-10">{label}</span>
        {you && (
          <span className="px-1.5 py-0.5 rounded bg-accent/10 font-mono text-[9px] text-accent uppercase tracking-widest">you</span>
        )}
      </div>
      <span className="font-mono text-xs text-ink/60">
        {address.slice(0, 8)}…{address.slice(-6)}
      </span>
    </div>
  )
}
