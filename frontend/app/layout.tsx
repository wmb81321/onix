import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { ConnectButton } from '@/components/connect-button'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600'] })

export const metadata: Metadata = {
  title: 'Convexo P2P',
  description: 'Trustless P2P crypto ↔ fiat settlement powered by Tempo and Stripe',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans bg-canvas text-ink antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-white/[0.07] px-6 h-14 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="font-mono text-xs font-medium tracking-[0.2em] text-ink/70 uppercase select-none">
                  Convexo P2P
                </span>
              </div>
              <ConnectButton />
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
              {children}
            </main>

            <footer className="border-t border-white/[0.07] px-6 py-3 flex items-center justify-between">
              <span className="font-mono text-[11px] text-dim/50">
                Moderato testnet · chain 42431
              </span>
              <span className="font-mono text-[11px] text-dim/50">
                Tempo · Stripe · Supabase
              </span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
