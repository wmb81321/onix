'use client'

import { useEffect, useState } from 'react'

type State = 'idle' | 'requesting' | 'waiting' | 'paid' | 'error'

export function LinkPayButton({
  tradeId,
  usdAmount,
  onPaid,
}: {
  tradeId:   string
  usdAmount: number
  onPaid?:   () => void
}) {
  const [state,       setState]       = useState<State>('idle')
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  // Poll trade status once we're in waiting state
  useEffect(() => {
    if (state !== 'waiting') return

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/trades/${tradeId}`)
        if (!res.ok) return
        const trade = await res.json() as { status: string }
        if (trade.status !== 'deposited') {
          setState('paid')
          onPaid?.()
        }
      } catch { /* ignore */ }
    }, 4000)

    return () => clearInterval(id)
  }, [state, tradeId, onPaid])

  async function handlePay() {
    setState('requesting')
    setError(null)

    try {
      const res = await fetch(`/api/trades/${tradeId}/link-pay`, { method: 'POST' })
      const data = await res.json() as {
        approvalUrl?: string
        spendRequestId?: string
        error?: string
        action?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to create Link payment request')
        if (data.action) setError(`${data.error ?? ''} ${data.action}`)
        setState('error')
        return
      }

      setApprovalUrl(data.approvalUrl ?? null)
      setState('waiting')
    } catch {
      setError('Network error — please try again')
      setState('error')
    }
  }

  if (state === 'paid') {
    return (
      <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-accent/5 border border-accent/20">
        <span className="text-accent text-sm">✓</span>
        <span className="font-mono text-xs text-accent">Payment confirmed — USDC releasing…</span>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <button
        onClick={() => { void handlePay() }}
        className="w-full py-2.5 rounded-lg bg-[#635bff] text-white font-mono text-sm font-semibold hover:bg-[#5244e0] transition-colors"
      >
        Pay with Stripe Link
      </button>
    )
  }

  if (state === 'requesting') {
    return (
      <div className="flex items-center gap-2 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#635bff] animate-pulse shrink-0" />
        <span className="font-mono text-xs text-dim">Creating spend request…</span>
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-caution animate-pulse shrink-0" />
          <span className="font-mono text-xs text-dim">
            Awaiting approval — ${(usdAmount + 0.10).toFixed(2)} USD
          </span>
        </div>
        {approvalUrl && (
          <a
            href={approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-[#635bff]/40 font-mono text-xs text-[#635bff] hover:bg-[#635bff]/5 transition-colors"
          >
            <span>Approve in Stripe Link</span>
            <span className="text-[#635bff]/60">→</span>
          </a>
        )}
        <p className="font-mono text-[10px] text-dim/40 text-center">
          Approve via your Stripe Link app or agent — payment processes automatically
        </p>
      </div>
    )
  }

  // error state
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
        {error}
      </p>
      <button
        onClick={() => setState('idle')}
        className="font-mono text-[10px] text-dim/50 hover:text-ink transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
