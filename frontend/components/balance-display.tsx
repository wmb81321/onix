'use client'

import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'

const USDC_ADDRESS = process.env.NEXT_PUBLIC_TEMPO_PATHUSDC_ADDRESS as `0x${string}` | undefined

const ABI = [{
  type: 'function' as const,
  name: 'balanceOf',
  inputs:  [{ name: 'account', type: 'address' as const }],
  outputs: [{ name: '',        type: 'uint256' as const }],
  stateMutability: 'view' as const,
}]

export function BalanceDisplay({ className }: { className?: string }) {
  const { address } = useAccount()

  const { data: raw, isLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!USDC_ADDRESS, refetchInterval: 10_000 },
  })

  if (!address) return null

  const balance = raw !== undefined
    ? Number(formatUnits(raw as bigint, 6)).toFixed(2)
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
