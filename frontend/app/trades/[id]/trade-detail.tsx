'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import type { Trade, TradeStatus } from '@/lib/supabase'
import { BuyerPaymentForm } from '@/components/buyer-payment-form'

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
  const [trade,  setTrade]  = useState<Trade>(initialTrade)
  const [copied, setCopied] = useState(false)
  const { address } = useAccount()

  const isSeller = address?.toLowerCase() === trade.seller_address.toLowerCase()
  const isBuyer  = address?.toLowerCase() === trade.buyer_address.toLowerCase()
  const isFailed = FAILED.includes(trade.status)
  const isDone   = trade.status === 'complete' || trade.status === 'released'

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/trades/${trade.id}`)
      if (!res.ok) return
      setTrade(await res.json() as Trade)
    } catch { /* ignore */ }
  }, [trade.id])

  useEffect(() => {
    if (trade.status === 'complete' || isFailed) return
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [trade.status, isFailed, poll])

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
        <InfoCell label="USDC" value={`${Number(trade.usdc_amount).toFixed(2)}`} accent />
        <InfoCell label="USD"  value={`$${Number(trade.usd_amount).toFixed(2)}`} />
        <InfoCell label="Rate" value={(Number(trade.usd_amount) / Number(trade.usdc_amount)).toFixed(4)} />
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
              return (
                <div key={step} className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${
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

      {/* Seller: deposit instructions (created state) */}
      {isSeller && trade.status === 'created' && (
        <div className="bg-panel rounded-xl border border-accent/20 p-4 space-y-3">
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
            Action required · Deposit USDC
          </span>
          <p className="font-mono text-xs text-dim leading-relaxed">
            Send exactly{' '}
            <span className="text-ink">{Number(trade.usdc_amount).toFixed(2)} USDC</span>{' '}
            to your virtual deposit address. Funds auto-forward to the agent escrow.
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

      {/* Seller: waiting for buyer payment */}
      {isSeller && trade.status === 'deposited' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-panel rounded-xl border border-white/[0.07]">
          <span className="w-1.5 h-1.5 rounded-full bg-caution animate-pulse shrink-0" />
          <span className="font-mono text-xs text-dim">
            Waiting for buyer to pay ${Number(trade.usd_amount).toFixed(2)} USD…
          </span>
        </div>
      )}

      {/* Buyer: waiting for seller deposit */}
      {isBuyer && trade.status === 'created' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-panel rounded-xl border border-white/[0.07]">
          <span className="w-1.5 h-1.5 rounded-full bg-caution animate-pulse shrink-0" />
          <span className="font-mono text-xs text-dim">
            Waiting for seller to deposit {Number(trade.usdc_amount).toFixed(2)} USDC…
          </span>
        </div>
      )}

      {/* Buyer: pay USD */}
      {isBuyer && trade.status === 'deposited' && (
        <div className="bg-panel rounded-xl border border-accent/20 p-4 space-y-4">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
              Action required · Pay USD
            </span>
            <p className="font-mono text-xs text-dim leading-relaxed mt-1.5">
              Seller has deposited{' '}
              <span className="text-ink">{Number(trade.usdc_amount).toFixed(2)} USDC</span>.
              Pay to complete and receive your USDC.
            </p>
          </div>
          <BuyerPaymentForm tradeId={trade.id} usdAmount={Number(trade.usd_amount)} />
        </div>
      )}

      {/* Rating widget — shown after settled */}
      {(isBuyer || isSeller) && isDone && (
        <RatingWidget
          tradeId={trade.id}
          raterAddress={address!}
          rateeAddress={isBuyer ? trade.seller_address : trade.buyer_address}
          rateeRole={isBuyer ? 'seller' : 'buyer'}
        />
      )}

    </div>
  )
}

// ── Rating widget ─────────────────────────────────────────────────────────────

function RatingWidget({
  tradeId, raterAddress, rateeRole,
}: {
  tradeId: string
  raterAddress: string
  rateeAddress: string
  rateeRole: 'buyer' | 'seller'
}) {
  const [score,     setScore]     = useState(0)
  const [hovered,   setHovered]   = useState(0)
  const [comment,   setComment]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function submit() {
    if (score === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/trades/${tradeId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rater_address: raterAddress, score, comment: comment || undefined }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to submit rating'); return }
      setSubmitted(true)
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-accent/5 rounded-xl border border-accent/20">
        <span className="text-accent text-sm">✓</span>
        <span className="font-mono text-xs text-accent">Rating submitted — thank you!</span>
      </div>
    )
  }

  return (
    <div className="bg-panel rounded-xl border border-white/[0.07] p-4 space-y-4">
      <span className="font-mono text-[10px] text-dim uppercase tracking-widest">
        Rate this {rateeRole}
      </span>

      {/* Stars */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setScore(n)}
            className={`text-2xl leading-none transition-colors ${
              n <= (hovered || score) ? 'text-caution' : 'text-white/10'
            }`}
          >
            ★
          </button>
        ))}
        {score > 0 && (
          <span className="font-mono text-xs text-dim ml-1">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][score]}
          </span>
        )}
      </div>

      {/* Optional comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment (optional)"
        maxLength={300}
        rows={2}
        className="w-full bg-canvas border border-white/[0.07] rounded-lg px-3 py-2 font-mono text-xs text-ink placeholder:text-dim/30 outline-none focus:border-accent/30 transition-colors resize-none"
      />

      {error && (
        <p className="font-mono text-[10px] text-danger/70">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={score === 0 || submitting}
        className="px-4 py-2 rounded-lg bg-accent text-canvas font-mono text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit Rating'}
      </button>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
