'use client'

import { useQuery } from '@tanstack/react-query'
import { useWalletClient } from 'wagmi'
import { formatUnits } from 'viem'

export type TokenBalance = {
  address: `0x${string}`
  balance: bigint
  decimals: number
  display: string
  name: string
  symbol: string
}

export type FormattedTokenBalance = TokenBalance & {
  formatted: string
}

export function useWalletBalances() {
  const { data: walletClient } = useWalletClient()

  return useQuery({
    queryKey: ['walletBalances', walletClient?.account?.address],
    queryFn: async (): Promise<FormattedTokenBalance[]> => {
      if (!walletClient) return []
      const result = await (walletClient as unknown as {
        request: (args: { method: string; params?: unknown[] }) => Promise<TokenBalance[]>
      }).request({
        method: 'wallet_getBalances',
        params: [],
      })
      return (result ?? []).map((token) => ({
        ...token,
        balance: BigInt(token.balance),
        formatted: Number(formatUnits(BigInt(token.balance), token.decimals)).toFixed(2),
      }))
    },
    enabled: !!walletClient,
    refetchInterval: 10_000,
  })
}
