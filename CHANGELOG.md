# Changelog

## [Unreleased]

## [0.6.0] — 2026-05-01
### Added — Phase 1: frontend wallet auth + user provisioning

- `frontend/components/connect-button.tsx` — real `tempoWallet()` connect/disconnect button using wagmi `useConnect`/`useAccount`/`useDisconnect`; fires `POST /api/users/upsert` on first connect to provision the Supabase `users` row
- `frontend/app/api/users/upsert/route.ts` — server-side Next.js route; uses service-role Supabase client (bypasses RLS) to upsert the user by wallet address; validates address with zod regex
- `frontend/lib/supabase-server.ts` — service-role Supabase client for server-only routes; throws clearly if env vars are missing
- `frontend/hooks/use-current-user.ts` — returns the connected wallet's `users` row via anon client (readable by all due to `using (true)` RLS policy on users)
- `frontend/app/layout.tsx` — replaced static `<button>` stub with real `<ConnectButton />`
- `frontend/lib/database.types.ts` — fixed: added `Relationships: []` on every table, `Views`, and `Functions` required by `@supabase/postgrest-js` v2.105.1 `GenericSchema` / `GenericTable` constraints; without these the entire `Schema` resolved as `never`, silently breaking all write operations
- `zod` added to `frontend/package.json`

### Env vars required on Vercel
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key from Supabase dashboard (server-only, never `NEXT_PUBLIC_`)
- `FACILITATOR_URL=https://convexo-p2p-agent-production.up.railway.app` — server-only

## [0.5.2] — 2026-05-01
### Added / Fixed — Railway GitHub integration + Flow A E2E on production

- **Railway deploy method changed to GitHub push** — connected repo `wmb81321/onix`, root dir `/agent`, builder: Dockerfile. `railway up` no longer used (it archives git-committed state only; working-tree changes were silently excluded).
- **`agent/Dockerfile` COPY paths corrected** — build context when Railway root dir is `/agent` means `COPY package.json ./` not `COPY agent/package.json ./`. Fixed all three COPY lines.
- **`MPP_SECRET_KEY` added to Railway env** — was missing entirely, causing agent to crash-loop on every boot with `Invalid or missing environment variables: MPP_SECRET_KEY: Required`.
- **`TEMPO_TESTNET_RPC_URL` added to Railway env** — `chain.ts` falls back to mainnet RPC if unset; with `TEMPO_CHAIN_ID=42431` (Moderato) this was a chain-ID mismatch. Value: `https://rpc.moderato.tempo.xyz`.
- **Flow A end-to-end confirmed on Railway production** — `POST /webhooks/stripe` with signed `transfer.paid` payload → trade advances to `released` → on-chain USDC transfer fired (tx `0xb8d589db44188522b441f11a4f69022e96efb1718d7acc3c738cf78101c65ab3`, Moderato testnet).
- **`frontend/vercel.json` created** — framework: nextjs, root dir `/frontend` for Vercel GitHub integration. Frontend deploying to Vercel.
- **`.env.example` updated** — added `AGENT_MASTER_SALT`, `AGENT_ACCESS_KEY_ADDRESS`, `MPP_SECRET_KEY`, `TEMPO_TESTNET_RPC_URL`, `TEMPO_CHAIN_ID`, `TEMPO_PATHUSDC_ADDRESS`; corrected testnet RPC URL.
- **CLAUDE.md Folder Structure** — corrected `app/` → `frontend/`; added deployment targets (Railway vs Vercel); documented `frontend/app/api/` as proxy layer for agent, not the agent itself; clarified `FACILITATOR_URL` = Railway agent URL.

### Architecture note
`FACILITATOR_URL=https://convexo-p2p-agent-production.up.railway.app` is a **server-only** Vercel env var. Frontend API route handlers on Vercel forward to this URL. The agent itself always runs on Railway as a persistent process.

## [0.5.1] — 2026-05-01
### Fixed — Flow A test run + API corrections

- `agent/src/lib/mppx.ts` — corrected mppx v0.6.8 import path (`mppx/server` not `mppx`); switched `tempo()` → `tempo.charge()`; replaced invalid `rpcUrl` param with `getClient` to anchor chain ID to Moderato (42431)
- `agent/src/routes/webhooks.ts` — fixed 400/500 status code discrimination: used regex to match Stripe's actual `WebhookSignatureVerificationError` messages instead of `includes('signature')` which falsely matched viem revert messages
- `nixpacks.toml` + `railway.json` — switched Railway start command to `cd agent && npx tsx src/index.ts` to bypass nixpacks TypeScript compilation failures; `nixpacks.toml` with empty build phase added
- `.env` — removed stray Stripe Connect setup URL from file; confirmed `STRIPE_WEBHOOK_SECRET` uses `stripe listen` test value

### Validated end-to-end (Moderato testnet, local)
- `POST /trades` → creates trade, derives virtual deposit address, marks order `matched` ✓
- `POST /trades/:id/settle` → returns proper MPP `402 Payment Required` challenge (amount 0.1 USDC, recipient agent EOA, externalId = tradeId) ✓
- `POST /webhooks/stripe` → signature verification passes; `transfer.paid` handler fires; trade advances to `released` (write-before-side-effect confirmed) ✓
- On-chain USDC transfer attempted: reverted with `InsufficientBalance` (agent has 0.989 USDC, needs 1.0) — requires testnet top-up to complete full round-trip

## [0.5.0] — 2026-05-01
### Added — Flow A settlement agent (Phases 1–5)

**Phase 1 — Core lib**
- `agent/src/lib/env.ts` — zod validates every env var at startup; exits with clear errors; exports typed `ENV` object; added `MPP_SECRET_KEY` field
- `agent/src/lib/schemas.ts` — canonical zod schemas for `TradeRow`, `OrderRow`, `UserRow` and their status enums; `coerce.number()` handles Supabase numeric-as-string
- `agent/src/tempo/chain.ts` — shared `tempoChain`, `publicClient`, `walletClient`, `agentAccount` extracted from inline usage in `monitor.ts`
- `agent/src/lib/supabase.ts` — `TradeStatus` now sourced from `schemas.ts` (removed duplicate union type)
- `agent/src/tempo/monitor.ts` — refactored to import chain/client from `chain.ts`
- `agent/src/index.ts` — manual env check loop replaced with single `ENV` import

**Phase 2 — External integrations**
- `agent/src/tempo/wallet.ts` — `transferUsdc(to, amountUsdc)` ERC-20 transfer via agent EOA; `getAgentUsdcBalance()` for pre-release checks
- `agent/src/stripe/client.ts` — Stripe singleton pinned to `apiVersion: '2026-04-22.preview'`
- `agent/src/stripe/payouts.ts` — `sendFiatToSeller(accountId, usdAmount, tradeId)` platform→Connect transfer with `idempotencyKey: tradeId`; `getPayoutMethods` for account inspection
- `agent/src/stripe/webhook.ts` — `verifyAndDispatch(rawBody, sig)` — `constructEvent` first, then routes to registered handlers; handler registry pattern (flows register on startup)

**Phase 3 — Settlement**
- `agent/src/lib/mppx.ts` — mppx singleton wired to agent EOA + pathUSD + Moderato; `chargeServiceFee(req, res, tradeId)` with `externalId: tradeId` for idempotency; complex generic type kept unexported to avoid declaration emit issues
- `agent/src/flows/flowA.ts` — full crypto→fiat orchestrator: `continueAfterFeePaid` (deposited→fee_paid→fiat_sent), `releaseUsdcToBuyer` (fiat_sent→released), `registerFlowAHandlers` (wires `transfer.paid` webhook); all state writes precede side-effects; full idempotency on every step
- `.env` — added `MPP_SECRET_KEY`

**Phase 4+5 — HTTP layer + wiring**
- `agent/src/lib/router.ts` — minimal path router with `:param` matching, per-route error boundary, `readRawBody` / `readJsonBody` / `json` helpers
- `agent/src/routes/trades.ts` — `POST /trades` (create trade, derive VA off-chain, start non-blocking deposit watcher); `POST /trades/:id/settle` (mppx 402 gate → `continueAfterFeePaid`)
- `agent/src/routes/webhooks.ts` — `POST /webhooks/stripe` (raw body read, `verifyAndDispatch`; 400 on bad sig, 500 on handler error so Stripe retries valid events)
- `agent/src/index.ts` — fully wired: registers Flow A handlers, mounts router, boots HTTP server, runs `startDepositMonitor` to resume pending deposits after restart

### Known gaps (next session)
- SPT execution (buyer's Stripe Link credential) in `flowA.ts` is a TODO — requires `/auth-stripe-link` + `mcp__link__*` integration
- Flow B (`flowB.ts`) not yet built
- Frontend order book not yet wired to agent

## [0.4.0] — 2026-05-01
### Completed — Infrastructure fully operational
- **Tempo Virtual Address master registered on-chain** — `AGENT_MASTER_ID=0x3ead6d3d`, salt mined for EOA `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0`, tx confirmed at block 15460573 (Moderato testnet, TIP-1022 registry `0xfdc0000000000000000000000000000000000000`)
- **Agent wallet clarified** — `AGENT_MASTER_ADDRESS` and `AGENT_ACCESS_KEY_ADDRESS` both point to the EOA `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0` (access key, not passkey wallet). Access key wallet holds the salt PoW and signs all on-chain transfers.
- **`agent/tsconfig.json` created** — strict mode, NodeNext module resolution, `outDir: ./dist`
- **`railway.json` fixed** — `startCommand` corrected to `node agent/dist/index.js` (repo-root-relative path for Railway monorepo)
- **`agent/src/tempo/monitor.ts` fixed** — replaced `import { tempo } from 'wagmi/chains'` with inline `defineChain` from `viem` + env vars; `wagmi` is frontend-only
- **Railway agent live** — `https://convexo-p2p-agent-production.up.railway.app/health` returns `{"status":"ok","version":"0.1.0"}`
- **Stripe webhook registered** — live mode, endpoint ID `we_1TSCLoIGWVzmFM6GKEWLa7QD`, all env vars confirmed in `.env`
- **Supabase schema applied** — `migrations/001_schema.sql` (users, orders, trades, ratings) + `migrations/002_rls.sql` applied to production project
- **mppx/server confirmed** — exports `{ Mppx, NodeListener, tempo, ... }`. `mppx.charge({ amount })` returns 402 Response or `{ withReceipt }`. `NodeListener.sendResponse(res, fetchResponse)` bridges to Node.js HTTP.
- **All env vars set** — `AGENT_MASTER_ID`, `AGENT_MASTER_SALT`, `AGENT_ACCESS_KEY`, `TEMPO_PATHUSDC_ADDRESS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` all in `.env`

### Next milestone — Flow A settlement logic
See `CLAUDE.local.md` for the exact build sequence.

## [0.3.0] — 2026-05-01
### Fixed
- `agent/src/index.ts`: replaced `Bun.serve()` with Node.js `createServer` (Bun not installed)
- `agent/src/index.ts`: fixed dotenv path resolution using `fileURLToPath(import.meta.url)`
- `agent/src/tempo/virtualAddresses.ts`: corrected `ox/tempo` API — `VirtualMaster.mineSaltAsync({ address, start, count, onProgress })`; `VirtualAddress.from({ masterId, userTag })`
- `agent/src/tempo/virtualAddresses.ts`: userTag derived via `keccak256(toBytes(tradeId)).slice(0,6)` — always valid hex for any tradeId string
- `frontend/lib/wagmi.ts`: `tempoWallet` imported from `wagmi/tempo` (not `wagmi/connectors`)
- `frontend/next.config.ts`: removed invalid `httpsOptions` experimental key
- `agent/package.json`: added missing `ox` dependency

### Changed
- Agent wallet: plain EOA used for autonomous signing instead of passkey Tempo Wallet
- `AGENT_ACCESS_KEY_ADDRESS` = `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0` (EOA that holds the virtual master PoW)
- `frontend/package.json`: upgraded wagmi `^2.15.0` → `^3.6.0` (required for `tempoWallet` export)
- `virtualAddresses.ts`: added `MINE_START` / `MINE_COUNT` env vars for resumable salt mining

## [0.2.0] — 2026-04-30
### Changed
- Architecture: replaced Privy with Tempo Wallet embedded (wagmi connector)
- Architecture: replaced custom Solidity escrow with Tempo Virtual Addresses (TIP-20 native)
- Architecture: removed ERC-8004, TEE, and Solidity from MVP scope
- Architecture: MPP session middleware (mppx library) replaces custom x402 MCP server for service fees
- Removed: .claude/rules/erc8004-patterns.md, .claude/rules/solidity-conventions.md
- Removed: .claude/commands/deploy-escrow.md, .claude/commands/register-agent.md
- Removed: mcp-servers/erc8004/, mcp-servers/tempo-escrow/
- Updated: CLAUDE.md, mcp.json, .env.example, README.md, all rule files
- Added: .claude/rules/tempo-patterns.md, .claude/commands/setup-virtual-master.md
- Added: ROADMAP.md, CHANGELOG.md

## [0.1.0] — 2026-04-30
### Added
- Initial workspace scaffold: CLAUDE.md, CLAUDE.local.md, mcp.json, .env.example
- .claude/settings.json with allow/deny permissions
- .claude/rules/: coding-style, testing-practices, stripe-integration, x402-patterns
- .claude/commands/: deploy-escrow, register-agent, test-flow-a, test-flow-b
- .claude/hooks/: post-code-change, pre-deploy, changelog-update
- .agents/skills/: stripe-best-practices, create-payment-credential, tempo-docs, privy, x402
- docs/agenticp2p.md: full architecture specification
- MCP: stripe, link (stdio), tempo, privy-docs connected
