import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <div className="space-y-3">
        <h1 className="text-5xl font-bold tracking-tight">
          Trade crypto for fiat.
          <br />
          <span className="text-indigo-400">Trustlessly.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          P2P settlement powered by Tempo and Stripe. No exchange, no screenshots,
          no trust required.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/orderbook"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium transition-colors"
        >
          View Order Book
        </Link>
        <a
          href="https://wallet.tempo.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 font-medium transition-colors"
        >
          Get Tempo Wallet
        </a>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-8 text-sm text-gray-400 max-w-lg w-full">
        <Stat label="Settlement" value="~500ms" />
        <Stat label="Service fee" value="0.1 USDC" />
        <Stat label="Custody" value="None" />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl border border-gray-800">
      <span className="text-white font-semibold text-lg">{value}</span>
      <span>{label}</span>
    </div>
  )
}
