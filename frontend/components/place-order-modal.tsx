'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { BalanceDisplay } from './balance-display'

type OrderType = 'buy' | 'sell'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (orderId: string) => void
}

export function PlaceOrderModal({ open, onClose, onCreated }: Props) {
  const { address } = useAccount()
  const [type,        setType]        = useState<OrderType>('sell')
  const [usdcAmount,  setUsdcAmount]  = useState('')
  const [rate,        setRate]        = useState('1.00')
  const [error,       setError]       = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) {
      setUsdcAmount('')
      setRate('1.00')
      setError(null)
    }
  }, [open])

  const usdc    = parseFloat(usdcAmount) || 0
  const rateNum = parseFloat(rate)       || 0
  const usd     = usdc * rateNum

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!address) { setError('Connect your wallet first'); return }
    if (usdc < 5)  { setError('Minimum order is 5 USDC');  return }
    if (rateNum <= 0) { setError('Rate must be positive'); return }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: address,
          type,
          usdc_amount:  usdc,
          rate:         rateNum,
        }),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to place order'); return }
      onCreated(data.id!)
      onClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-panel border border-white/[0.09] rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <span className="font-mono text-xs text-dim uppercase tracking-widest">New Order</span>
          <button
            onClick={onClose}
            className="text-dim/50 hover:text-ink transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-canvas rounded-lg">
            {(['sell', 'buy'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-colors ${
                  type === t
                    ? t === 'sell'
                      ? 'bg-accent text-canvas font-semibold'
                      : 'bg-caution/20 text-caution font-semibold'
                    : 'text-dim hover:text-ink'
                }`}
              >
                {t === 'sell' ? 'Sell USDC' : 'Buy USDC'}
              </button>
            ))}
          </div>

          {/* USDC Amount */}
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] text-dim uppercase tracking-widest">
              USDC Amount
            </span>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-canvas rounded-lg border border-white/[0.07] focus-within:border-accent/40 transition-colors">
              <input
                type="number"
                min="5"
                step="0.01"
                placeholder="10.00"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(e.target.value)}
                className="flex-1 bg-transparent font-mono text-sm text-ink placeholder:text-dim/30 outline-none"
                required
              />
              <span className="font-mono text-xs text-dim/50 shrink-0">USDC</span>
            </div>
          </label>

          {/* Rate */}
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] text-dim uppercase tracking-widest">
              Rate <span className="text-dim/50 normal-case">(USD per USDC)</span>
            </span>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-canvas rounded-lg border border-white/[0.07] focus-within:border-accent/40 transition-colors">
              <input
                type="number"
                min="0.01"
                step="0.001"
                placeholder="1.00"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="flex-1 bg-transparent font-mono text-sm text-ink placeholder:text-dim/30 outline-none"
                required
              />
            </div>
          </label>

          {/* Computed output */}
          {usdc >= 5 && rateNum > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 bg-canvas/60 rounded-lg border border-white/[0.05]">
              <span className="font-mono text-[11px] text-dim">
                {type === 'sell' ? 'You receive' : 'You pay'}
              </span>
              <span className="font-mono text-sm font-medium text-accent">
                ${usd.toFixed(2)} USD
              </span>
            </div>
          )}

          {/* Balance */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-dim/50">Your balance</span>
            <BalanceDisplay className="font-mono" />
          </div>

          {/* Error */}
          {error && (
            <p className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Hint */}
          <p className="font-mono text-[10px] text-dim/40 text-center">
            Min. 5 USDC · 24h expiry · non-refundable listing fee
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !address}
            className="w-full py-2.5 rounded-lg bg-accent text-canvas text-sm font-semibold font-mono hover:bg-accent-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Placing…' : !address ? 'Connect wallet' : 'Place Order'}
          </button>

        </form>
      </div>
    </div>
  )
}
