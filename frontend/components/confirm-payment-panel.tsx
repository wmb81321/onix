'use client'

import { useState } from 'react'

interface Props {
  tradeId: string
  sellerAddress: string
  usdAmount: number
  paymentMethod: string | null
  paymentReference: string | null
  paymentProofUrl: string | null
  onConfirmed: () => void
}

export function ConfirmPaymentPanel({
  tradeId,
  sellerAddress,
  usdAmount,
  paymentMethod,
  paymentReference,
  paymentProofUrl,
  onConfirmed,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function confirm() {
    setConfirming(true)
    setError(null)
    try {
      const res = await fetch(`/api/trades/${tradeId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_address: sellerAddress }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to confirm'); return }
      onConfirmed()
    } catch {
      setError('Network error — please try again')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
        Buyer marked payment as sent
      </span>

      {/* Payment details */}
      <div className="space-y-1.5">
        {paymentMethod && (
          <div className="flex items-center justify-between px-3 py-2 bg-canvas/60 rounded-lg border border-white/[0.06]">
            <span className="font-mono text-[10px] text-dim/70 uppercase tracking-widest">Method</span>
            <span className="font-mono text-xs text-ink/80">{paymentMethod}</span>
          </div>
        )}
        {paymentReference && (
          <div className="flex items-center justify-between px-3 py-2 bg-canvas/60 rounded-lg border border-white/[0.06]">
            <span className="font-mono text-[10px] text-dim/70 uppercase tracking-widest">Reference</span>
            <span className="font-mono text-xs text-ink/80 truncate max-w-[180px]">{paymentReference}</span>
          </div>
        )}
        {paymentProofUrl && (
          <div className="flex items-center justify-between px-3 py-2 bg-canvas/60 rounded-lg border border-white/[0.06]">
            <span className="font-mono text-[10px] text-dim/70 uppercase tracking-widest">Proof</span>
            <a
              href={paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-accent/70 hover:text-accent transition-colors"
            >
              view →
            </a>
          </div>
        )}
      </div>

      <p className="font-mono text-xs text-dim/70 leading-relaxed">
        Check your account for a <span className="text-ink">${usdAmount.toFixed(2)} USD</span> payment.
        Once confirmed, tap below — USDC will be released on-chain to the buyer automatically.
      </p>

      {error && (
        <p className="font-mono text-[10px] text-danger/70">{error}</p>
      )}

      <button
        onClick={confirm}
        disabled={confirming}
        className="w-full py-2.5 rounded-lg bg-accent text-canvas font-mono text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {confirming ? 'Confirming…' : `I received $${usdAmount.toFixed(2)} — Release USDC`}
      </button>
    </div>
  )
}
