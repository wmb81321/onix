'use client'

import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { Hooks } from 'wagmi/tempo'

// Fallback to the known Moderato testnet pathUSD address so the hook always
// queries the correct TIP-20 token even when the env var is absent at build time.
export const PATHUSDC = (
  process.env.NEXT_PUBLIC_TEMPO_PATHUSDC_ADDRESS ?? '0x20c0000000000000000000000000000000000000'
) as `0x${string}`

export function BalanceDisplay({ className }: { className?: string }) {
  const { address } = useAccount()

  const { data, isLoading } = Hooks.token.useGetBalance({
    account:  address,
    token:    PATHUSDC,
    query:    { enabled: !!address, refetchInterval: 10_000 },
  })

  if (!address) return null

  const balance = data !== undefined
    ? Number(formatUnits(data as bigint, 6)).toFixed(2)
    : null

  return (
    <span className={className}>
      {isLoading || balance === null
        ? <span className="text-dim/40">···</span>
        : <><span className="text-ink/70">{balance}</span> <span className="text-dim/50">USDC</span></>
      }
    </span>
  )
}
