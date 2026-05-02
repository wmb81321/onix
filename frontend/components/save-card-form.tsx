'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const APPEARANCE = {
  theme: 'night' as const,
  variables: { colorPrimary: '#7c6af7', borderRadius: '8px', fontFamily: 'monospace' },
}

function InnerForm({
  userAddress,
  onSaved,
}: {
  userAddress: string
  onSaved: (brand: string, last4: string) => void
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,    setError]    = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSaving(true)
    setError(null)

    const { setupIntent, error: stripeErr } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })

    if (stripeErr) {
      setError(stripeErr.message ?? 'Card setup failed')
      setSaving(false)
      return
    }

    const pmId = typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id

    if (!pmId) {
      setError('No payment method returned')
      setSaving(false)
      return
    }

    const res = await fetch('/api/stripe/payment-method/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress, payment_method_id: pmId }),
    })
    const data = await res.json() as { ok?: boolean; brand?: string; last4?: string; error?: string }

    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Failed to save card')
      setSaving(false)
      return
    }

    onSaved(data.brand ?? 'card', data.last4 ?? '????')
    setSaving(false)
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="font-mono text-[10px] text-danger/70">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || saving}
        className="w-full py-2.5 rounded-lg bg-accent text-canvas font-mono text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : 'Save card for auto-pay'}
      </button>
    </form>
  )
}

export function SaveCardForm({
  userAddress,
  onSaved,
}: {
  userAddress: string
  onSaved: (brand: string, last4: string) => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [fetchError,   setFetchError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stripe/setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress }),
    })
      .then((r) => r.json() as Promise<{ clientSecret?: string; error?: string }>)
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setFetchError(data.error ?? 'Failed to initialise')
      })
      .catch(() => setFetchError('Network error'))
  }, [userAddress])

  if (fetchError) {
    return <p className="font-mono text-[10px] text-danger/70">{fetchError}</p>
  }
  if (!clientSecret) {
    return <p className="font-mono text-[10px] text-dim/40">Loading…</p>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: APPEARANCE }}>
      <InnerForm userAddress={userAddress} onSaved={onSaved} />
    </Elements>
  )
}
