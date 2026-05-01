/**
 * Watches Tempo TIP-20 Transfer events for virtual deposit addresses.
 * When a deposit arrives, transitions trade to 'deposited'.
 *
 * Key rule: never call balanceOf(virtualAddress) — it always returns zero.
 * Instead, watch Transfer events where `to === virtualAddress`.
 */

import { parseAbiItem } from 'viem'
import { publicClient } from './chain.js'
import { db, updateTradeStatus } from '../lib/supabase.js'

const TIP20_TRANSFER_ABI = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
)

export async function watchDeposit(
  virtualAddress: `0x${string}`,
  tradeId: string,
  tokenAddress: `0x${string}`,
  expectedAmount: bigint,
  deadlineMs: number,
): Promise<'deposited' | 'timeout'> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unwatch()
      resolve('timeout')
    }, deadlineMs - Date.now())

    const unwatch = publicClient.watchEvent({
      address: tokenAddress,
      event: TIP20_TRANSFER_ABI,
      args: { to: virtualAddress },
      onLogs: async (logs) => {
        for (const log of logs) {
          if ((log.args.value ?? 0n) >= expectedAmount) {
            clearTimeout(timer)
            unwatch()
            await updateTradeStatus(tradeId, 'deposited')
            resolve('deposited')
            return
          }
        }
      },
    })
  })
}

export async function startDepositMonitor(tokenAddress: `0x${string}`) {
  const { data: trades } = await db
    .from('trades')
    .select('id, virtual_deposit_address, usdc_amount, deposit_deadline')
    .eq('status', 'created')

  if (!trades?.length) return

  console.log(`[monitor] Watching ${trades.length} pending deposit(s)`)

  // Run all watchers in parallel — each resolves independently on deposit or timeout
  await Promise.all(trades.map(async (trade) => {
    const deadlineMs = new Date(trade.deposit_deadline).getTime()

    // Already expired — mark immediately instead of starting a watcher
    if (Date.now() >= deadlineMs) {
      await updateTradeStatus(trade.id, 'deposit_timeout')
      console.log(`[monitor] Trade ${trade.id} → deposit_timeout (already expired)`)
      return
    }

    const result = await watchDeposit(
      trade.virtual_deposit_address as `0x${string}`,
      trade.id,
      tokenAddress,
      BigInt(Math.round(trade.usdc_amount * 1e6)),
      deadlineMs,
    )

    if (result === 'timeout') {
      await updateTradeStatus(trade.id, 'deposit_timeout')
      console.log(`[monitor] Trade ${trade.id} → deposit_timeout`)
    }
  }))
}
