'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

interface StripeStatus {
  connected:         boolean
  account_id:        string | null
  details_submitted: boolean
  charges_enabled?:  boolean
}

export function StripeConnectButton({ onStatusChange }: { onStatusChange?: (connected: boolean) => void }) {
  const { address } = useAccount()
  const [status,  setStatus]  = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) { setStatus(null); return }

    fetch(`/api/stripe/account-status?address=${address}`)
      .then((r) => r.json() as Promise<StripeStatus>)
      .then((s) => {
        setStatus(s)
        onStatusChange?.(s.connected && s.details_submitted)
      })
      .catch(() => setStatus(null))
  }, [address, onStatusChange])

  async function connect() {
    if (!address) return
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: address }),
      })
      const data = await res.json() as { onboarding_url?: string; error?: string }
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url
      }
    } finally {
      setLoading(false)
    }
  }

  if (!address) return null

  // Already fully onboarded
  if (status?.connected && status.details_submitted) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span className="font-mono text-[11px] text-dim">
          Stripe connected
          {status.charges_enabled === false && (
            <span className="text-caution ml-1">(pending approval)</span>
          )}
        </span>
      </div>
    )
  }

  // Account created but onboarding incomplete
  if (status?.connected && !status.details_submitted) {
    return (
      <button
        onClick={connect}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-caution/30 bg-caution/5 text-caution font-mono text-[11px] hover:border-caution/50 transition-colors disabled:opacity-50"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-caution shrink-0" />
        {loading ? 'loading…' : 'Complete Stripe setup →'}
      </button>
    )
  }

  // Not connected
  return (
    <button
      onClick={connect}
      disabled={loading || !status}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-dim font-mono text-[11px] hover:border-white/20 hover:text-ink transition-colors disabled:opacity-40"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
      {loading ? 'loading…' : 'Connect Stripe'}
    </button>
  )
}
