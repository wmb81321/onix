# Convexo P2P — Project Memory

Convexo P2P is an agentic crypto-fiat settlement app where an AI Agent coordinates trades between unknown counterparties using Tempo's native primitives. Crypto escrow is handled via Tempo Virtual Addresses (TIP-20 native deposit attribution that auto-forwards to a master wallet); fiat is moved via Stripe Link (Global Payouts for push, SPTs for pull); the 0.1 USDC service fee is charged via MPP session middleware (`mppx`); Stripe webhooks (signature-verified) drive on-chain USDC release. No custom Solidity, no TEE, no ERC-8004, no Privy in the MVP — Tempo Wallet, Virtual Addresses, MPP, Stripe Link, and Supabase carry the full stack.

---

## Current Build Status (2026-05-01)

**Infrastructure is fully operational. Settlement flows are the next milestone.**

| Layer | Status | Notes |
|---|---|---|
| Supabase schema + RLS | ✓ Live | `users`, `orders`, `trades`, `ratings` — applied to production |
| Tempo Virtual Address | ✓ Registered | `AGENT_MASTER_ID=0x3ead6d3d`, on-chain Moderato testnet |
| Agent wallet (EOA) | ✓ Funded | `AGENT_ACCESS_KEY_ADDRESS=0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0` |
| Railway agent | ✓ Live | `https://convexo-p2p-agent-production.up.railway.app` — health check ok |
| Stripe webhook | ✓ Registered | Live mode (`we_1TSCLoIGWVzmFM6GKEWLa7QD`), all keys in `.env` |
| mppx/server | ✓ Verified | `import { Mppx, NodeListener, tempo } from 'mppx/server'` — works |
| Flow A agent (`flowA.ts`) | ✓ Built | All 5 phases complete — see [0.5.0] in CHANGELOG |
| Flow B agent (`flowB.ts`) | ✗ Not built | Needs `/auth-stripe-link` first, then SPT integration |
| Frontend order book | ✗ Stub | `app/` exists, routes not wired to agent yet |

**Start here for the next session:** `CLAUDE.local.md` → "What's next" section.

---

## Folder Structure

| Folder | Purpose |
|---|---|
| `app/` | Next.js App Router — order book UI, Tempo Wallet (`tempoWallet()` connector), trade tracker, Stripe Link onboarding |
| `app/api/` | Order, trade, and Stripe webhook routes |
| `agent/` | TypeScript settlement runtime — boots MPP server, drives state machine, monitors deposits |
| `agent/src/flows/` | `flowA.ts` (crypto→fiat), `flowB.ts` (fiat→crypto) — one orchestrator per flow |
| `agent/src/tempo/` | `wallet.ts` (master transfer ops), `monitor.ts` (TIP-20 Transfer event watcher), virtual address derivation |
| `agent/src/stripe/` | `payouts.ts` (Global Payouts), `webhook.ts` (constructEvent + dispatch), SPT execution |
| `mcp-servers/` | Project MCPs — `stripe-payouts/` (build first), `x402-mpp/` (build second) |
| `supabase/` | SQL migrations + RLS policies for `orders`, `trades`, `ratings` |
| `docs/` | `agenticp2p.md` and architecture references |
| `.claude/` | Workspace rules, slash commands, hooks for Claude Code |

---

## Stack

| Layer | Tech | Role | Key Constraint |
|---|---|---|---|
| User wallet | Tempo Wallet (`tempoWallet()` Wagmi connector) | Passkey accounts, portable across apps, built-in bridge | Import `tempo` from `wagmi/chains`, `tempoWallet` from `wagmi/connectors` |
| Deposits | TIP-20 Virtual Addresses | Per-trade deposit address derived off-chain, auto-forwards to master | `VirtualAddress.from({ masterId, userTag: tradeId })` — userTag never reused |
| Agent wallet | Tempo master wallet + access keys | Holds all escrow USDC, bounded signing via access keys | `AGENT_MASTER_ID` immutable; access keys carry `maxSpend` + `expiry` |
| Service fee | MPP session via `mppx` library | 0.1 USDC per settlement gated by HTTP 402 session middleware | `mppx.session({ amount: '0.1', unitType: 'settlement' })` |
| Fiat pull | Stripe Link `create-payment-credential` / SPT | Buyer pre-authorizes Agent; Agent executes 402 payment | SPT is single-use — never store, never retry consumed tokens |
| Fiat push | Stripe Global Payouts → Link | Agent pushes USD to Seller's Link account | Stripe API `2026-04-22.preview`; `country:"CO"` + US supported |
| Fiat proof | Stripe signed webhook | `stripe.webhooks.constructEvent()` triggers USDC release | Cryptographic verification — never trust without verifying signature |
| Bridging | Tempo Wallet built-in (LayerZero / Relay / Squid) | Users bring USDC into Tempo from any chain | No custom bridge UI in this app — link to `wallet.tempo.xyz` |
| Order book | Supabase Realtime + Postgres | Live orders, trade state machine, ratings | RLS on every table; anon key in browser only |
| Frontend | Next.js App Router | Order book UI, Stripe Link onboarding, trade tracker | Service-role Supabase key never reaches the browser |
| Agent runtime | TypeScript / Node.js | MPP server, settlement orchestrator, deposit monitor | All state transitions idempotent; persist to Supabase before side-effects |
| Discovery | `tempo wallet services` registry | Agent listed as discoverable paid service for other agents | Register once per environment (testnet vs mainnet) |

---

## The Two Flows

### Flow A — Crypto → Fiat (Seller has USDC on Tempo, Buyer pays USD via Stripe Link)
1. Seller connects Tempo Wallet (passkey); bridges USDC via built-in bridge if needed.
2. Seller posts a sell order on the Supabase order book.
3. Buyer matches → Agent creates trade in Supabase (`status: created`).
4. Agent derives virtual deposit address for this trade off-chain via `VirtualAddress.from({ masterId, userTag: tradeId })`.
5. Seller sends USDC to the virtual address → auto-forwards to Agent master wallet (`status: deposited`).
6. Agent issues HTTP 402 → Buyer pays 0.1 USDC service fee via MPP session (`status: fee_paid`).
7. Buyer authorizes `create-payment-credential` SPT scoped to the trade amount.
8. Agent executes Stripe Global Payout → USD lands in Seller's Link account (`status: fiat_sent`).
9. Stripe webhook fires (signed) → Agent verifies → releases USDC from master to Buyer's address (`status: released`).
10. Both parties rate each other in Supabase (`status: complete`).

### Flow B — Fiat → Crypto (Buyer has USD in Stripe Link, wants USDC on Tempo)
1. Seller posts a sell order (already has USDC on Tempo).
2. Buyer matches → Agent creates trade.
3. Virtual address derived → Seller deposits USDC (`status: deposited`).
4. Buyer pays 0.1 USDC fee via MPP session (`status: fee_paid`).
5. Buyer authorizes SPT for trade amount → Agent executes Stripe debit from Buyer's Link → credit to Seller's Link (`status: fiat_sent`).
6. Stripe webhook (signed) → Agent releases USDC to Buyer's Tempo address (`status: released → complete`).

---

## Trade State Machine

```
created → deposited → fee_paid → fiat_sent → released → complete
```

**Failure states:** `deposit_timeout` (no USDC arrived within 30 min), `stripe_failed` (payout/SPT rejected; refund USDC to Seller), `refunded` (terminal after rollback).

All transitions persist to Supabase BEFORE the side-effect runs — a crash mid-step replays from the last persisted state.

---

## Skill Trigger Table

Claude Code should automatically activate these skills when context matches:

| Skill | Activate when... |
|---|---|
| `create-payment-credential` | Writing or reviewing any Stripe Link spend-delegation / SPT code, `create-payment-credential` calls, Flow B buyer authorization |
| `stripe-best-practices` | Any Stripe API usage — webhooks, Connect accounts, Global Payouts, Connection Sessions, restricted keys, webhook signature verification |
| `tempo-docs` | Tempo protocol questions, TIP-20 stablecoin behaviour, Virtual Addresses, MPP, Tempo Wallet integration |
| `privy` | Reference only — Privy is NOT used in MVP (Tempo Wallet replaces it); skill kept for cross-reference if a Phase 2 hybrid is considered |
| `x402` | Building HTTP 402 servers/clients, `mppx` middleware, MPP session/oneTime, payment-identifier extension, Bazaar discovery |

---

## MCP + CLI Tooling

All tools confirmed working. See `mcp.json` for project-level server config.

### MCPs (always available in every Claude session)

| Task | Tool | Tool prefix |
|---|---|---|
| Tempo protocol docs — TIP-20, Virtual Addresses, MPP, chain config | `tempo` MCP (HTTP) | `mcp__tempo__*` |
| Third-party lib docs — viem, wagmi, Stripe SDK, mppx, zod, Next.js | `context7` MCP (stdio) | `mcp__plugin_context7_context7__*` |
| Supabase — SQL, migrations, RLS, logs, edge functions | `supabase` plugin | `mcp__plugin_supabase_supabase__*` |
| Stripe API — payouts, accounts, webhooks, products | `stripe` plugin | `mcp__plugin_stripe_stripe__*` |
| Stripe Link — SPTs, MPP payments, payment methods, onboarding | `link` MCP (stdio) | `mcp__link__*` (needs `/auth-stripe-link` first) |
| Browser automation — Stripe Link widget E2E testing | `playwright` plugin | `mcp__plugin_playwright_playwright__*` |
| GitHub — PRs, issues, commits | `github` plugin | `mcp__github__*` |

### CLIs (authenticated, available via Bash)

| CLI | Auth status | Key commands |
|---|---|---|
| `tempo` | Logged in — Moderato key expires 2026-05-31 | `tempo wallet keys`, `tempo wallet transfer`, `tempo wallet services` |
| `stripe` | Authenticated, projects plugin installed | `stripe listen`, `stripe trigger`, `stripe events resend` |
| `railway` | Logged in as wmb81321@gmail.com | `railway up`, `railway logs`, `railway variables set` |
| `cast` (Foundry) | Ready, no auth needed | `cast send`, `cast balance`, `cast call` |
| `npx @stripe/link-cli` | **NOT authenticated** — run `/auth-stripe-link` | `auth login`, `auth status` |
| `supabase` CLI | Not installed — use `plugin:supabase` MCP instead | — |

---

## Hard Rules for Claude Code

1. **`AGENT_MASTER_ID` is sacred.** Store in env, never recompute from a different account, never lose. Losing it means losing all in-flight deposit attribution. Set once per environment (testnet, then mainnet).
2. **USDC release happens ONLY after Stripe webhook signature is verified** with `stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)`. Never trust a webhook payload without the signature check. No bypass paths.
3. **All trade state writes hit Supabase BEFORE the on-chain or fiat side-effect runs.** A crash mid-step must be replayable from the persisted state — every transition is crash-recoverable and idempotent.
4. **MPP session amounts are TIP-20 stablecoins.** Confirm token addresses for testnet (pathUSD/alphaUSD/betaUSD/thetaUSD) vs mainnet (bridged USDC). Never hardcode; read from env.
5. **Stripe SPTs are one-time-use.** Never store after consumption, never retry a used token, never cache. A second attempt with the same token must fail cleanly.
6. **Access keys on the Agent's Tempo wallet must carry explicit `maxSpend` and `expiry`.** Never use the master passkey for programmatic transfers in production.
7. **No service-role Supabase key in any browser-shipped code.** Use the anon key + RLS policies. Server-only routes are the only place the service-role key is allowed.
8. **Virtual addresses have zero on-chain balance by design.** Never call `balanceOf(virtualAddress)` to detect arrivals — it always returns zero. Watch TIP-20 `Transfer` events with `to === virtualAddress`.
9. **Stripe API version `2026-04-22.preview` is required** for `v2/core/accounts` (Global Payouts). Pin the version explicitly in every Stripe client construction.
10. **All HTTP 402 challenges are handled by `mppx` middleware.** Never implement the challenge/response cycle manually — use `mppx.session()` or `mppx.oneTime()` exclusively.
11. **Deposit timeout is 30 minutes.** If USDC has not arrived at the virtual address within 30 minutes of trade creation, transition to `deposit_timeout`, notify both parties, and free the order book slot.
12. **`CHANGELOG.md` is updated after every meaningful change** — agent flows, MCP servers, schema migrations, deploy events, architectural shifts.

---

## After You Finish

After any non-trivial change, run this checklist:

- [ ] `CHANGELOG.md` updated with date, area, and one-line summary
- [ ] Trade state transitions still write to Supabase before any side-effect
- [ ] No service-role Supabase key visible to client bundles
- [ ] Stripe webhook signature verification untouched / still present
- [ ] No re-implementation of HTTP 402 outside `mppx`
- [ ] Tests run cleanly — `/test-flow-a` and `/test-flow-b` for end-to-end coverage
- [ ] Env variables documented in `.env.example` if added/removed
- [ ] No secrets committed (re-check `git diff` before commit)
