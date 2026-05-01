'use client'

import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { Hooks } from 'wagmi/tempo'

const PATHUSDC = process.env.NEXT_PUBLIC_TEMPO_PATHUSDC_ADDRESS as `0x${string}` | undefined

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
