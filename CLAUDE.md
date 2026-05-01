# Convexo P2P — Project Memory

Convexo P2P is an agentic crypto-fiat settlement app where an AI Agent coordinates trades between unknown counterparties using Tempo's native primitives. Crypto escrow is handled via Tempo Virtual Addresses (TIP-20 native deposit attribution that auto-forwards to a master wallet); fiat is moved via Stripe (PaymentElement for buyers, Stripe Connect + Global Payouts for sellers); the 0.1 USDC service fee is charged via MPP session middleware (`mppx`); Stripe webhooks (signature-verified) drive on-chain USDC release. No custom Solidity, no TEE, no ERC-8004, no Privy in the MVP — Tempo Wallet, Virtual Addresses, MPP, Stripe, and Supabase carry the full stack.

---

## Current Build Status (2026-05-01)

**All phases shipped. Frontend on Vercel, agent on Railway. Full end-to-end working on Moderato testnet.**

| Layer | Status | Notes |
|---|---|---|
| Supabase schema + RLS | ✓ Live | `users`, `orders`, `trades`, `ratings` — production |
| Tempo Virtual Address | ✓ Registered | `AGENT_MASTER_ID=0x3ead6d3d`, on-chain Moderato testnet |
| Agent wallet (EOA) | ✓ Funded | `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0` |
| Railway agent | ✓ Live v0.7.0 | `https://convexo-p2p-agent-production.up.railway.app` |
| Railway deploy method | ✓ Git-push | Repo: `wmb81321/onix`, root dir: `/agent`, builder: Dockerfile |
| Vercel frontend | ✓ Live | Repo: `wmb81321/onix`, root dir: `/frontend`, Next.js |
| Stripe webhook | ✓ Registered | Test mode (`we_1TSOSkIeMhBdGlf7tM8ekyQI`) |
| Flow A agent (`flowA.ts`) | ✓ E2E tested | payment_intent.succeeded + transfer.paid → complete |
| Order book | ✓ Done | BUY + SELL orders, filter tabs, Realtime, Match buttons |
| Place order modal | ✓ Done | Stripe Connect required for sell, confirmation feedback |
| Trade tracker | ✓ Done | Deposit address, BuyerPaymentForm, rating widget |
| Account page | ✓ Done | Balance (native hook), faucet, Stripe status, history |
| Ratings | ✓ Done | 1-5 stars after released/complete, updates rating_avg |
| BUY order matching | ✓ Done | Buyer/seller roles swapped correctly for BUY orders |
| Stripe Link SPT | ✗ Future | Phase 6 — needs buyer Link onboarding + SPT flow |
| Flow B (fiat→crypto) | ✗ Future | Blocked on Stripe Link SPT |
| Mainnet deploy | ✗ Future | Switch chain, real USDC, live Stripe keys |

---

## Folder Structure

| Folder | Purpose | Deployed to |
|---|---|---|
| `frontend/` | Next.js App Router — order book, trade tracker, account, payment forms | Vercel |
| `frontend/app/api/` | Server-side proxy routes forwarding to Railway agent (`FACILITATOR_URL`) | Vercel (server) |
| `agent/` | TypeScript settlement runtime — HTTP server, state machine, deposit monitor | Railway (persistent) |
| `agent/src/flows/` | `flowA.ts` — `continueAfterFeePaid` and `releaseUsdcToBuyer` | Railway |
| `agent/src/tempo/` | `wallet.ts`, `monitor.ts`, virtual address derivation | Railway |
| `agent/src/stripe/` | `payouts.ts`, `webhook.ts` | Railway |
| `supabase/` | SQL migrations + RLS policies | Supabase (production) |
| `docs/` | Architecture references | — |
| `.claude/` | Workspace rules, slash commands, hooks | — |
| `.agents/skills/` | tempo-docs, stripe-best-practices, create-payment-credential, x402, privy | — |

### Why two deployments?

The **agent** needs a persistent long-running process (deposit monitor, Stripe webhook listener, on-chain signing). Vercel serverless functions time out and can't maintain state — incompatible with the settlement runtime. The **frontend** on Vercel calls the agent via `FACILITATOR_URL` (server-only env var, never `NEXT_PUBLIC_`).

---

## Stack

| Layer | Tech | Key Constraint |
|---|---|---|
| User wallet | Tempo Wallet (`tempoWallet()` wagmi connector) | Import `tempoModerato` from `viem/chains`, `tempoWallet` from `wagmi/tempo` |
| Deposits | TIP-20 Virtual Addresses | `VirtualAddress.from({ masterId, userTag: tradeId })` — userTag never reused |
| Agent wallet | Tempo master wallet + access keys | `AGENT_MASTER_ID` immutable; access keys carry `maxSpend` + `expiry` |
| Service fee | MPP session via `mppx` | `mppx.session({ amount: '0.1', unitType: 'settlement' })` |
| Fiat payment | Stripe PaymentElement | PaymentIntent server-side; `payment_intent.succeeded` triggers flow |
| Seller payout | Stripe Global Payouts → Connect | Stripe API `2026-04-22.preview`; idempotency key = tradeId |
| Fiat proof | Stripe signed webhook | `constructEvent()` always; `payment_intent.succeeded` + `transfer.paid` |
| Balance reading | `Hooks.token.useGetBalance` from `wagmi/tempo` | Not `useReadContract` — native TIP-20 hook |
| Testnet faucet | `Hooks.faucet.useFundSync` from `wagmi/tempo` | In-app, no redirect, testnet only |
| Order book | Supabase Realtime + Postgres | RLS on every table; anon key in browser only |
| Frontend | Next.js 15 App Router | Service-role key never in browser bundles |
| Agent | TypeScript / Node.js | Idempotent; Supabase write before every side-effect |

---

## Trade State Machine

```
created → deposited → fee_paid → fiat_sent → released → complete
```

**Agent entry points:**
- `payment_intent.succeeded` → `continueAfterFeePaid()` → `fiat_sent`
- `transfer.paid` → `releaseUsdcToBuyer()` → `released` → `complete`
- `POST /trades/:id/settle` (mppx 402 gate) → `continueAfterFeePaid()` (legacy)

**Failure states:** `deposit_timeout` (30 min), `stripe_failed`, `refunded`

All transitions write Supabase BEFORE the side-effect runs.

---

## The Flow

### SELL order match
1. Seller posts SELL order + connects Stripe account.
2. Buyer matches → agent creates trade, derives virtual deposit address.
3. Seller deposits USDC → auto-forwards to master wallet.
4. Buyer pays USD via Stripe PaymentElement on `/trades/[id]`.
5. `payment_intent.succeeded` → agent sends USD to seller via Stripe transfer.
6. `transfer.paid` → agent releases USDC on-chain to buyer.
7. Both rate → `complete`.

### BUY order match (roles swapped)
- Order poster = buyer (wants USDC, will pay USD).
- Matcher = seller (deposits USDC, receives USD).
- Same agent flow from step 3 onward.

---

## Skill Trigger Table

| Skill | Activate when... |
|---|---|
| `create-payment-credential` | Stripe Link SPT code, Flow B buyer authorization |
| `stripe-best-practices` | Any Stripe API usage — webhooks, Connect, Global Payouts |
| `tempo-docs` | Tempo protocol, TIP-20, Virtual Addresses, MPP, Tempo Wallet |
| `privy` | Reference only — not used in MVP |
| `x402` | HTTP 402, `mppx` middleware, MPP session/oneTime |

---

## MCP + CLI Tooling

| Task | Tool | Prefix |
|---|---|---|
| Tempo protocol docs | `tempo` MCP | `mcp__tempo__*` |
| Third-party lib docs | `context7` MCP | `mcp__plugin_context7_context7__*` |
| Supabase | `supabase` plugin | `mcp__plugin_supabase_supabase__*` |
| Stripe API | `stripe` plugin | `mcp__plugin_stripe_stripe__*` |
| Stripe Link / SPTs | `link` MCP | `mcp__link__*` |
| Browser automation | `playwright` plugin | `mcp__plugin_playwright_playwright__*` |
| GitHub | `github` plugin | `mcp__github__*` |

| CLI | Auth | Key commands |
|---|---|---|
| `tempo` | Logged in — Moderato key expires 2026-05-31 | `tempo wallet fund`, `tempo wallet transfer` |
| `stripe` | Authenticated | `stripe listen`, `stripe trigger` |
| `railway` | Logged in | `git push origin main` deploys; `railway logs` |
| `cast` | Ready | `cast send`, `cast balance` |
| `npx @stripe/link-cli` | ✓ Authenticated | `auth status`, `spend-request create` |

---

## Hard Rules for Claude Code

1. **`AGENT_MASTER_ID` is sacred.** Never recompute, never lose.
2. **USDC release ONLY after `stripe.webhooks.constructEvent()` succeeds.** No bypass.
3. **Supabase state written BEFORE every on-chain or fiat side-effect.** Crash-recoverable.
4. **MPP amounts in TIP-20 stablecoins.** Never hardcode; read from env.
5. **Stripe SPTs one-time-use.** Never store or retry a consumed token.
6. **Access keys carry `maxSpend` and `expiry`.** Never use master passkey programmatically.
7. **No service-role Supabase key in browser-shipped code.**
8. **Never `balanceOf(virtualAddress)`.** Watch `Transfer` events with `to === virtualAddress`.
9. **Stripe API version `2026-04-22.preview`** for Global Payouts.
10. **All HTTP 402 via `mppx`.** Never implement the challenge/response manually.
11. **Deposit timeout: 30 minutes.**
12. **`CHANGELOG.md` updated after every meaningful change.**
13. **`Hooks.token.useGetBalance` from `wagmi/tempo`** for TIP-20 balance reads.
14. **`Hooks.faucet.useFundSync` from `wagmi/tempo`** for testnet faucet.

---

## After You Finish

- [ ] `CHANGELOG.md` updated
- [ ] State transitions write Supabase before side-effects
- [ ] No service-role key in client bundles
- [ ] Stripe webhook signature verification untouched
- [ ] No manual HTTP 402 implementation
- [ ] No secrets committed
