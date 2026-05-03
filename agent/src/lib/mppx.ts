/**
 * mppx singleton for HTTP 402 / MPP service fee charging.
 *
 * Uses the `tempo/charge` method — one-time TIP-20 transfer per call.
 * The agent's EOA is both the signer (account) and the payment recipient.
 *
 * Usage in a Node.js route handler:
 *
 *   const result = await chargeServiceFee(req, res, orderId)
 *   if (result.status === 402) return   // challenge written to res, done
 *   // result.status === 200 → fee received, proceed
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
      // Agent EOA co-signs pull-mode transactions as fee payer.
      // Tempo passkey wallets produce type-0x78 txs that need a fee payer
      // countersignature before broadcast — without this the RPC returns
      // "fee payer signature recovery failed".
      feePayer: true,
      getClient: () => publicClient,
      testnet: ENV.NODE_ENV !== 'production',
    }),
  ],
})

export type ChargeResult = { status: 402 } | { status: 200 }

/**
 * Charge the 0.1 USDC service fee.
 * Writes a 402 challenge to `res` automatically if payment is pending.
 * Pass the order ID (or trade ID for legacy paths) as `externalId` — ensures retries never double-charge.
 */
export async function chargeServiceFee(
  req: IncomingMessage,
  res: ServerResponse,
  externalId: string,
): Promise<ChargeResult> {
  const handler = mppx['tempo/charge']({
    amount: ENV.CHARGE_AMOUNT_USDC.toString(),
    externalId,
  })

  const result = await Mppx.toNodeListener(handler)(req, res)
  return { status: result.status as 402 | 200 }
}
