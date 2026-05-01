'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect } from 'react'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (!isConnected || !address) return
    fetch('/api/users/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    }).catch((err) => console.error('[users/upsert]', err))
  }, [isConnected, address])

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span className="font-mono text-xs text-ink/70 group-hover:text-ink transition-colors">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </button>
    )
  }

  const connector = connectors[0]

  return (
    <button
      onClick={() => connector && connect({ connector })}
      disabled={isPending || !connector}
      className="px-4 py-1.5 rounded-lg bg-accent text-canvas text-xs font-semibold font-mono hover:bg-accent-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
    >
      {isPending ? 'connecting…' : 'connect wallet'}
    </button>
  )
}
