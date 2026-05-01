# Changelog

## [Unreleased]

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
