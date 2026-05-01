import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ConnectButton } from '@/components/connect-button'
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
