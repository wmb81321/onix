'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect } from 'react'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  // Provision users row on first connect — fire and forget
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
        className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium font-mono transition-colors"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    )
  }

  const connector = connectors[0]

  return (
    <button
      onClick={() => connector && connect({ connector })}
      disabled={isPending || !connector}
      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors disabled:opacity-50"
    >
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
