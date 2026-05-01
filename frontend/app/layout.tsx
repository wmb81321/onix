import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Convexo P2P',
  description: 'Trustless P2P crypto ↔ fiat settlement powered by Tempo and Stripe',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-950 text-white">
            <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <span className="font-semibold tracking-tight">Convexo P2P</span>
              <ConnectButton />
            </header>
            <main className="max-w-5xl mx-auto px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}

// Inline connect button — extracted to a real component in Week 2
function ConnectButton() {
  return (
    <button
      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors"
      // onClick handled by ConnectWallet component (Week 2)
    >
      Connect Wallet
    </button>
  )
}
