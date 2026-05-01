'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentResult({ tradeId }: { tradeId: string }) {
  const searchParams = useSearchParams()
  const status = searchParams.get('redirect_status')
  const success = status === 'succeeded'

  return (
    <div className="w-full max-w-sm bg-panel rounded-2xl border border-white/[0.07] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-danger/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-caution/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-accent/50" />
        <span className="font-mono text-[11px] text-dim ml-2">payment_result.ts</span>
      </div>
      <div className="p-6 space-y-4 text-center">
        <div className="flex justify-center">
          <span className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg ${
            success
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            {success ? '✓' : '✕'}
          </span>
        </div>
        <div className="space-y-1.5">
          <h2 className="font-semibold text-ink">
            {success ? 'Payment confirmed' : 'Payment failed'}
          </h2>
          <p className="font-mono text-xs text-dim leading-relaxed">
            {success
              ? 'USD received. The agent will now send funds to the seller and release USDC to your wallet.'
              : 'Something went wrong. Please return to the trade and try again.'}
          </p>
        </div>
        <Link
          href={`/trades/${tradeId}`}
          className="block w-full py-2.5 rounded-lg bg-accent text-canvas font-mono text-sm font-semibold hover:bg-accent-2 transition-colors text-center"
        >
          View Trade →
        </Link>
      </div>
    </div>
  )
}

export default function PaymentReturnPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [tradeId, setTradeId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ id }) => setTradeId(id))
  }, [params])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <Suspense fallback={
        <div className="w-full max-w-sm bg-panel rounded-2xl border border-white/[0.07] p-8 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      }>
        {tradeId && <PaymentResult tradeId={tradeId} />}
      </Suspense>
    </div>
  )
}
