# Convexo P2P — Tempo Integration Patterns

Project-specific rules for how this codebase uses Tempo: Virtual Addresses, Tempo Wallet, access keys, MPP middleware, and the EVM execution surface.

## Virtual Address Master

- **`AGENT_MASTER_ID` is sacred.** Losing it means losing deposit attribution for every in-flight trade. Back it up out-of-band (password manager + secure note) the moment `VirtualMaster.mineSaltAsync()` returns it. Set ONCE per environment.
- **Never recompute the master ID from a different account.** The master ID is bound to the originating account; deriving from a fresh wallet produces a different ID and orphans every prior deposit address.
- **Run `/setup-virtual-master` once on testnet, then once on mainnet.** Treat the two as independent, with separate env entries.

## Deriving Deposit Addresses

- **Always use `VirtualAddress.from({ masterId, userTag })`** where `userTag` is the trade ID encoded as hex (or any unique, deterministic per-trade value).
- **Never reuse a `userTag`.** One trade = one virtual address. Reusing a tag re-derives the same address and breaks per-trade attribution.
- Derivation is **off-chain, free, instant.** Do not write any state to the chain when generating an address — just call the helper and persist the result in Supabase on the trade row.

## Deposit Detection

- **Watch TIP-20 `Transfer` events** where `to === virtualAddress`. The auto-forward to the master happens in the same transaction; both legs are visible in the event log for attribution.
- **NEVER call `balanceOf(virtualAddress)`** to check whether USDC has arrived — virtual addresses always read zero on-chain. Polling balance will never trigger a state transition.
- Use `viem`'s `watchContractEvent` (or equivalent) bound to the TIP-20 token contract; filter on `to`.

## Wagmi / Frontend Wallet

- **Always import `tempo` from `wagmi/chains` and `tempoWallet` from `wagmi/connectors`.** Never hardcode chain IDs, RPC URLs, or copy-paste a chain config.
- The connector is `tempoWallet()` — passkey-based, portable across apps, includes the built-in bridge UI inside `wallet.tempo.xyz`.
- The frontend never needs a separate bridge widget; deep-link users to their Tempo Wallet for funding.

```ts
import { tempo } from 'wagmi/chains'
import { tempoWallet } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [tempo],
  connectors: [tempoWallet()],
  transports: { [tempo.id]: http() },
})
```

## Access Keys (Agent-Side Signing)

- **The agent uses scoped access keys, not the master passkey,** for any programmatic transfer. Always set `maxSpend` (cap per key) and `expiry` (rotate regularly).
- Store the active access key as `AGENT_ACCESS_KEY` in env. Rotate by issuing a new key, updating env, restarting; old key naturally expires.
- A compromised access key has bounded blast radius — that's the entire point. Never elevate to passkey for a "one-off" task.

## MPP Middleware

- **Use `mppx.session()` for pay-as-you-go multi-step flows** (preferred for our settlement endpoint — one fee opens the channel, vouchers settle within it).
- **Use `mppx.oneTime()` for per-request charges** when the operation is genuinely single-shot.
- Wrap Next.js / Express / Hono handlers — never write the 402 challenge handshake by hand.

```ts
import { Mppx } from 'mppx'
import { tempo } from 'mppx/methods'

const mppx = Mppx.create({ methods: [tempo({ account: agentKey })] })
export const POST = mppx.session({ amount: '0.1', unitType: 'settlement' })(handler)
```

## Testnet Stablecoins

- Tempo testnet exposes **pathUSD, alphaUSD, betaUSD, thetaUSD** as TIP-20 stablecoins.
- Fund the agent and test wallets via `tempo wallet fund` (free, faucet-backed).
- Mainnet uses real USDC bridged in via LayerZero / Relay / Squid through the Tempo Wallet bridge UI.

## EVM Compatibility

- Tempo targets the **Osaka EVM hard fork.** Standard `viem` / `ethers.js` patterns work — use `viem` consistently in this project.
- Configure `viem` clients with the Tempo chain config from `wagmi/chains` (no manual RPC strings).

## Finality

- **Sub-second, deterministic finality.** One block = final. Do not poll for confirmations or wait for N blocks — that pattern is a holdover from probabilistic chains and adds nothing here.
- React to `Transfer` event arrival immediately; treat it as final.

## Fee Token

- Users pay gas in **TIP-20 stablecoins, not ETH.** No need to maintain a gas-token balance separately from the trading balance.
- The agent can sponsor fees for users via Tempo's fee sponsorship mechanism — opt in only when UX requires it (e.g., a user on their first trade who has no stablecoin yet for gas).
