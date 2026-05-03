# p2pai — x402 / MPP Patterns

This project uses the **`mppx` library** for HTTP 402 / MPP session middleware. We do not roll our own 402 challenge/response handshake.

## Library Choice

- **Use `mppx` v0.6.8+ (`mppx/server`)** — not raw `@x402/axios`. `mppx` is the Tempo-native MPP library and provides node-listener helpers for our plain `http` server.
- Construct the `Mppx` instance once at module load (`agent/src/lib/mppx.ts`) and reuse it across requests.

## Server Side — Charge Helper

- **Use `mppx['tempo/charge']({ amount, externalId })`** inside `POST /trades/:id/settle`. The charge writes the 402 challenge to the response if the fee has not yet been paid, and returns a 200-class result once the payment lands. The trade ID makes the perfect `externalId` for idempotency.
- The settle endpoint marks `payment_sent` (with `method='x402'`); it does **not** release USDC. USDC release still requires the seller to call `POST /trades/:id/confirm-payment`. This is intentional — the mppx fee proves the agent paid, not that the fiat actually arrived.

```ts
import { Mppx, tempo } from 'mppx/server'
import { privateKeyToAccount } from 'viem/accounts'

const mppx = Mppx.create({
  secretKey: ENV.MPP_SECRET_KEY,
  methods: [tempo({
    account:   privateKeyToAccount(ENV.AGENT_ACCESS_KEY as `0x${string}`),
    currency:  ENV.TEMPO_PATHUSDC_ADDRESS as `0x${string}`,
    recipient: ENV.AGENT_ACCESS_KEY_ADDRESS as `0x${string}`,
  })],
})

const result = await Mppx.toNodeListener(
  mppx['tempo/charge']({ amount: '0.1', externalId: tradeId })
)(nodeReq, nodeRes)
// 402 → challenge written, return early
// 200 → fee received, call markPaymentSent(tradeId, 'x402', tradeId)
```

## Client Side — Mppx.create

- **Set `maxDeposit` to the expected max session value** — it caps the per-channel escrow. Too low and the session refuses additional vouchers; too high and a compromised client risks more than necessary.
- Vouchers are off-chain EIP-712 signatures — once the session opens, settlement of subsequent calls has zero on-chain latency.

```ts
const mppx = Mppx.create({
  methods: [tempo({ account, maxDeposit: '1' })],
})
```

## Service Discovery

- **Register the agent as a discoverable paid service** via `tempo wallet services`. This makes p2pai findable by other agents that want to pay for settlement.
- Re-register on every environment (testnet vs mainnet) as separate listings.

## Idempotency

- **Always pass `externalId: tradeId`** on every charge — without it, retries can double-charge. mppx uses the externalId to deduplicate.
- The same trade ID on two charge attempts must converge to a single settled charge.
- `markPaymentSent` is idempotent at the state level: if the trade is already past `deposited` it short-circuits without writing again. Combined with the externalId dedup, the settle endpoint is safe to retry.

## Service Fee Timing

- **The 0.1 USDC service fee is charged when the agent (or an autonomous buyer) calls `POST /trades/:id/settle`, AFTER the seller has deposited.** The settle endpoint enforces `trade.status === 'deposited'` before invoking mppx — calling it earlier returns 409.
- Source the amount from `CHARGE_AMOUNT_USDC` env — never hardcode in source.
- The fee is fully separate from the buyer's USD payment to the seller. mppx pays the platform; the buyer pays the seller off-platform.

## Error Handling

- 402 challenges with unsupported networks must be rejected with a clear error and the challenge body logged — never silently fall through to a different rail.
- Treat any non-200 response after payment as a billing failure; roll back any preliminary state to `created`.

## Networks

- **Production:** Tempo mainnet — fee charged in mainnet TIP-20 USDC.
- **Testing / staging:** Tempo testnet — fee charged in testnet stablecoins (pathUSD / alphaUSD / etc.).
- Do not mix rails — service-fee charges and escrow live on the same chain (Tempo) by design.
