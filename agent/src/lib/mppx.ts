/**
 * mppx singleton for HTTP 402 / MPP service fee charging.
 *
 * Uses the `tempo/charge` method — one-time TIP-20 transfer per call.
 * The agent's EOA is both the signer (account) and the payment recipient.
 *
 * Usage in a Node.js route handler:
 *
 *   const result = await chargeServiceFee(req, res, tradeId)
 *   if (result.status === 402) return   // challenge written to res, done
 *   // result.status === 200 → fee received, proceed with settlement
 */

import { Mppx, tempo } from 'mppx/server'
import { privateKeyToAccount } from 'viem/accounts'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { publicClient } from '../tempo/chain.js'
import { ENV } from './env.js'

// Not exported — complex generic type cannot be named in declaration files.
// Consumers use chargeServiceFee() exclusively.
const mppx = Mppx.create({
  secretKey: ENV.MPP_SECRET_KEY,
  methods: [
    tempo.charge({
      account: privateKeyToAccount(ENV.AGENT_ACCESS_KEY as `0x${string}`),
      currency: ENV.TEMPO_PATHUSDC_ADDRESS as `0x${string}`,
      recipient: ENV.AGENT_ACCESS_KEY_ADDRESS as `0x${string}`,
      getClient: () => publicClient,
      testnet: ENV.NODE_ENV !== 'production',
    }),
  ],
})

export type ChargeResult = { status: 402 } | { status: 200 }

/**
 * Charge the 0.1 USDC service fee for a trade.
 * Writes a 402 challenge to `res` automatically if payment is pending.
 * `externalId: tradeId` ensures retries never double-charge.
 */
export async function chargeServiceFee(
  req: IncomingMessage,
  res: ServerResponse,
  tradeId: string,
): Promise<ChargeResult> {
  const handler = mppx['tempo/charge']({
    amount: ENV.CHARGE_AMOUNT_USDC.toString(),
    externalId: tradeId,
  })

  const result = await Mppx.toNodeListener(handler)(req, res)
  return { status: result.status as 402 | 200 }
}
