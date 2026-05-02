'use client'

import { useState } from 'react'

type State = 'idle' | 'requesting' | 'waiting' | 'error'

export function LinkPayButton({
  tradeId,
  usdAmount,
}: {
  tradeId:   string
  usdAmount: number
}) {
  const [state,       setState]       = useState<State>('idle')
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  async function handlePay() {
    setState('requesting')
    setError(null)

    try {
      const res = await fetch(`/api/trades/${tradeId}/link-pay`, { method: 'POST' })
      const data = await res.json() as { approvalUrl?: string; spendRequestId?: string; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to create Link payment request')
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

  if (state === 'idle') {
    return (
      <button
        onClick={handlePay}
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
        <span className="font-mono text-xs text-dim">Creating payment request…</span>
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-caution animate-pulse shrink-0" />
          <span className="font-mono text-xs text-dim">
            Waiting for approval — ${(usdAmount + 0.10).toFixed(2)} USD
          </span>
        </div>
        {approvalUrl && (
          <a
            href={approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 text-center rounded-lg border border-[#635bff]/40 font-mono text-xs text-[#635bff] hover:bg-[#635bff]/5 transition-colors"
          >
            Approve in Stripe Link →
          </a>
        )}
        <p className="font-mono text-[10px] text-dim/40 text-center">
          Check your Stripe Link app or tap the link above
        </p>
      </div>
    )
  }

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
