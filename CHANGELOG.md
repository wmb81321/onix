# Changelog

## [Unreleased]

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
