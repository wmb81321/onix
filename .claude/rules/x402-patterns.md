# Convexo P2P — x402 / MPP Patterns

This project uses the **`mppx` library** for HTTP 402 / MPP session middleware. We do not roll our own 402 challenge/response handshake.

## Library Choice

- **Use `mppx`** — not raw `@x402/axios`. `mppx` is the Tempo-native MPP session library and provides Express / Next.js / Hono middleware out of the box.
- Construct the `Mppx` instance once at module load and reuse it across requests.

## Server Side — Session Middleware

- **Use `mppx.session({ amount, unitType })`** to gate the settlement endpoint. A session opens once, then off-chain EIP-712 vouchers settle subsequent calls within the channel — zero on-chain latency after open.
- **Use `mppx.oneTime({ amount })`** for genuinely single-shot charges that don't benefit from session reuse.
- Session preferred for the trade settlement flow (multi-step: fee → SPT → release → rate).

```ts
import { Mppx } from 'mppx'
import { tempo } from 'mppx/methods'

const mppx = Mppx.create({ methods: [tempo({ account: agentKey })] })
export const POST = mppx.session({ amount: '0.1', unitType: 'settlement' })(handler)
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

- **Register the agent as a discoverable paid service** via `tempo wallet services`. This makes Convexo P2P findable by other agents that want to pay for settlement.
- Re-register on every environment (testnet vs mainnet) as separate listings.

## Idempotency

- **Always include the `payment-identifier` extension** on every charge — the trade ID makes a perfect identifier. Without it, retries can double-charge.
- The same trade ID on two charge attempts must converge to a single settled charge.

## Service Fee Timing

- **The 0.1 USDC service fee is charged BEFORE the virtual deposit address is issued to the seller.** A failed fee payment short-circuits the trade — no address, no further state transitions, the trade stays `created`.
- Source the amount from `CHARGE_AMOUNT_USDC` env — never hardcode in source.

## Error Handling

- 402 challenges with unsupported networks must be rejected with a clear error and the challenge body logged — never silently fall through to a different rail.
- Treat any non-200 response after payment as a billing failure; roll back any preliminary state to `created`.

## Networks

- **Production:** Tempo mainnet — fee charged in mainnet TIP-20 USDC.
- **Testing / staging:** Tempo testnet — fee charged in testnet stablecoins (pathUSD / alphaUSD / etc.).
- Do not mix rails — service-fee charges and escrow live on the same chain (Tempo) by design.
