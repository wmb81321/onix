'use client'

import { useAccount } from 'wagmi'
import { Hooks } from 'wagmi/tempo'
import { formatUnits } from 'viem'

// All TIP-20 stablecoins on Tempo Moderato testnet (6 decimals each)
const TOKENS = [
  { address: '0x20c0000000000000000000000000000000000000' as `0x${string}`, symbol: 'pathUSD',  name: 'Path USD',   decimals: 6 },
  { address: '0x20c0000000000000000000000000000000000001' as `0x${string}`, symbol: 'AlphaUSD', name: 'Alpha USD',  decimals: 6 },
  { address: '0x20c0000000000000000000000000000000000002' as `0x${string}`, symbol: 'BetaUSD',  name: 'Beta USD',   decimals: 6 },
  { address: '0x20c0000000000000000000000000000000000003' as `0x${string}`, symbol: 'ThetaUSD', name: 'Theta USD',  decimals: 6 },
] as const

export type TokenBalance = {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  balance: bigint
  formatted: string
}

// Hook calls at module level — always the same four, never in a loop.
// Hooks.token.useGetBalance reads the TIP-20 balanceOf via wagmi/core tempo Actions.
export function useWalletBalances() {
  const { address } = useAccount()
  const query = { enabled: !!address, refetchInterval: 10_000 }

  const r0 = Hooks.token.useGetBalance({ account: address, token: TOKENS[0].address, query })
  const r1 = Hooks.token.useGetBalance({ account: address, token: TOKENS[1].address, query })
  const r2 = Hooks.token.useGetBalance({ account: address, token: TOKENS[2].address, query })
  const r3 = Hooks.token.useGetBalance({ account: address, token: TOKENS[3].address, query })

  const results = [r0, r1, r2, r3] as const
  const isLoading = results.some((r) => r.isLoading)

  const data: TokenBalance[] = TOKENS.flatMap((token, i) => {
    const raw = results[i]?.data
    if (raw == null) return []
    const balance = raw as bigint
    return [{
      ...token,
      balance,
      formatted: Number(formatUnits(balance, token.decimals)).toFixed(2),
    }]
  })

  function refetch() {
    results.forEach((r) => { void r.refetch() })
  }

  return { data, isLoading, refetch }
}
