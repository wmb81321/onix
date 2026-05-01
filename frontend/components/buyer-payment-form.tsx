'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({
  tradeId,
  usdAmount,
}: {
  tradeId: string
  usdAmount: number
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,  setError]  = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setError(null)

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/payment-return/${tradeId}`,
      },
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-canvas rounded-lg border border-white/[0.07]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <p className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full py-2.5 rounded-lg bg-accent text-canvas font-mono text-sm font-semibold hover:bg-accent-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {paying ? 'Processing…' : `Pay $${(usdAmount + 0.10).toFixed(2)} USD`}
      </button>
      <p className="font-mono text-[10px] text-dim/40 text-center">
        ${usdAmount.toFixed(2)} trade + $0.10 service fee
      </p>
    </form>
  )
}

export function BuyerPaymentForm({
  tradeId,
  usdAmount,
}: {
  tradeId: string
  usdAmount: number
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/trades/${tradeId}/payment-intent`, { method: 'POST' })
      .then((r) => r.json() as Promise<{ client_secret?: string; error?: string }>)
      .then((data) => {
        if (data.client_secret) {
          setClientSecret(data.client_secret)
        } else {
          setFetchError(data.error ?? 'Failed to initialize payment')
        }
      })
      .catch(() => setFetchError('Network error'))
      .finally(() => setLoading(false))
  }, [tradeId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="font-mono text-xs text-dim">Preparing payment…</span>
      </div>
    )
  }

  if (fetchError) {
    return (
      <p className="font-mono text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
        {fetchError}
      </p>
    )
  }

  if (!clientSecret) return null

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary:       '#00ff88',
            colorBackground:    '#07090d',
            colorText:          '#e6edf3',
            colorTextSecondary: '#7d8590',
            borderRadius:       '8px',
            fontFamily:         '"JetBrains Mono", monospace',
          },
        },
      }}
    >
      <CheckoutForm tradeId={tradeId} usdAmount={usdAmount} />
    </Elements>
  )
}
