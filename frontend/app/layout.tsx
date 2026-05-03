import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Link from 'next/link'
import { Providers } from './providers'
import { ConnectButton } from '@/components/connect-button'
import './globals.css'

export const metadata: Metadata = {
  title: 'p2pai',
  description: 'Peer-to-peer crypto ↔ fiat settlement. AI agent coordinates trades between unknown counterparties on Tempo.',
  icons: { icon: '/brand-kit/svg/mark/mark-color.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-canvas text-ink antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-white/[0.07] px-6 h-14 flex items-center justify-between shrink-0">
              <Link href="/" className="flex items-center">
                <img
                  src="/brand-kit/svg/lockup-horizontal/horizontal-color-dark.svg"
                  alt="p2pai"
                  className="h-7 w-auto"
                />
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/orderbook" className="font-mono text-[11px] text-dim hover:text-ink transition-colors hidden sm:block">
                  Order Book
                </Link>
                <Link href="/account" className="font-mono text-[11px] text-dim hover:text-ink transition-colors hidden sm:block">
                  Account
                </Link>
                <Link href="/agents" className="font-mono text-[11px] text-dim hover:text-ink transition-colors hidden sm:block">
                  For Agents
                </Link>
                <ConnectButton />
              </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
              {children}
            </main>

            <footer className="border-t border-white/[0.07] px-6 py-3 flex items-center justify-between">
              <span className="font-mono text-[11px] text-dim/50">
                Moderato testnet · chain 42431
              </span>
              <span className="font-mono text-[11px] text-dim/50">
                Tempo · Supabase
              </span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
