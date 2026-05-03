'use client'

import { useAccount } from 'wagmi'
import { Hooks } from 'wagmi/tempo'
import { formatUnits } from 'viem'

export const PATHUSDC_ADDRESS = '0x20c0000000000000000000000000000000000000' as `0x${string}`
export const PATHUSDC_DECIMALS = 6

export function usePathUsdBalance() {
  const { address } = useAccount()

  const { data, isLoading, isError, refetch } = Hooks.token.useGetBalance({
    account: address,
    token:   PATHUSDC_ADDRESS,
    query:   { enabled: !!address, refetchInterval: 10_000 },
  })

  const raw = data as bigint | undefined
  const formatted = raw != null
    ? Number(formatUnits(raw, PATHUSDC_DECIMALS)).toFixed(2)
    : null

  return {
    balance:   raw,
    formatted,
    isLoading,
    isError,
    refetch:   () => { void refetch() },
  }
}
