import Link from 'next/link'

export default function StripeReturnPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="w-full max-w-sm bg-panel rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-caution/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/50" />
          <span className="font-mono text-[11px] text-dim ml-2">stripe_connect.ts</span>
        </div>
        <div className="p-6 space-y-4 text-center">
          <div className="flex justify-center">
            <span className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-lg">
              ✓
            </span>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-semibold text-ink">Stripe account connected</h2>
            <p className="font-mono text-xs text-dim leading-relaxed">
              Your account is set up to receive USD payouts
              when trades settle. You can now place sell orders.
            </p>
          </div>
          <Link
            href="/orderbook"
            className="block w-full py-2.5 rounded-lg bg-accent text-canvas font-mono text-sm font-semibold hover:bg-accent-2 transition-colors text-center"
          >
            Go to Order Book →
          </Link>
        </div>
      </div>

      <p className="font-mono text-[11px] text-dim/40 text-center max-w-xs">
        Stripe will review your account. You can start trading once
        your account is approved — usually instant in test mode.
      </p>
    </div>
  )
}
