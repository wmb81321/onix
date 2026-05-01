import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] gap-12">

      {/* Hero */}
      <div className="text-center space-y-5 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/[0.06] text-accent font-mono text-[11px] tracking-widest uppercase mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Moderato · Chain 42431 · Testnet
        </div>

        <h1 className="text-4xl sm:text-[2.75rem] font-semibold tracking-tight text-ink leading-[1.15]">
          Crypto ↔ fiat settlement.
          <br />
          <span className="text-accent">No trust required.</span>
        </h1>

        <p className="text-dim text-[15px] leading-relaxed max-w-lg mx-auto">
          An AI agent settles trades between unknown counterparties.
          Funds held in virtual addresses on Tempo.
          Released only on cryptographically verified fiat proof.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Link
          href="/orderbook"
          className="px-5 py-2.5 rounded-lg bg-accent text-canvas text-sm font-semibold hover:bg-accent-2 transition-colors"
        >
          Open Order Book →
        </Link>
        <a
          href="https://wallet.tempo.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-lg border border-white/10 text-dim text-sm font-medium hover:border-white/20 hover:text-ink transition-colors"
        >
          Get Tempo Wallet
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden w-full max-w-md">
        <Stat label="Settlement" value="~500ms" />
        <Stat label="Platform fee" value="0.2 USDC" />
        <Stat label="Custody" value="Zero" />
      </div>

      {/* Settlement flow terminal */}
      <div className="w-full max-w-md bg-panel rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-caution/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/50" />
          <span className="font-mono text-[11px] text-dim ml-2 tracking-wider">
            flow_a.ts — settlement sequence
          </span>
        </div>
        <div className="px-4 py-4 font-mono text-xs space-y-2 leading-relaxed">
          <FlowLine n="01" text="seller deposits USDC → virtual address"   hi />
          <FlowLine n="02" text="agent detects Transfer event on-chain" />
          <FlowLine n="03" text="agent gates settle() behind MPP 402" />
          <FlowLine n="04" text="buyer pays 0.1 USDC service fee"           hi />
          <FlowLine n="05" text="agent pushes USD → seller Stripe account"  hi />
          <FlowLine n="06" text="stripe fires signed transfer.paid webhook" />
          <FlowLine n="07" text="agent verifies signature, releases USDC"   hi />
        </div>
      </div>

    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-5 px-4 bg-panel">
      <span className="font-mono text-lg font-semibold text-accent">{value}</span>
      <span className="font-mono text-[10px] text-dim uppercase tracking-widest">{label}</span>
    </div>
  )
}

function FlowLine({ n, text, hi }: { n: string; text: string; hi?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-white/20 select-none shrink-0">{n}</span>
      <span className={hi ? 'text-ink/85' : 'text-dim/60'}>{text}</span>
    </div>
  )
}
