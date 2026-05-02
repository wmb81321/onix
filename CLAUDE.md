# Convexo P2P — Project Memory

Convexo P2P is an agentic P2P crypto-fiat settlement app. An AI Agent coordinates trades between unknown counterparties using Tempo's native primitives. Crypto escrow is handled via Tempo Virtual Addresses (TIP-20 native deposit attribution that auto-forwards to a master wallet); fiat is moved via Stripe (PaymentElement or Stripe Link spend request for buyers, Stripe Connect + Global Payouts for sellers); the 0.1 USDC service fee is charged via MPP session middleware (`mppx`); Stripe webhooks (signature-verified) drive on-chain USDC release. No custom Solidity, no TEE, no ERC-8004, no Privy in the MVP — Tempo Wallet, Virtual Addresses, MPP, Stripe, and Supabase carry the full stack.

---

## Current Build Status (2026-05-02) — v1.4.0

**All MVP phases shipped. Frontend on Vercel, agent on Railway.**

| Layer | Status | Notes |
|---|---|---|
| Supabase schema + RLS | ✓ Live | `users`, `orders`, `trades`, `ratings` — 5 migrations applied |
| Tempo Virtual Address | ✓ Registered | `AGENT_MASTER_ID=0x3ead6d3d`, on-chain Moderato testnet |
| Agent wallet (EOA) | ✓ Funded | `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0` |
| Railway agent | ✓ Live v1.4.0 | `https://convexo-p2p-agent-production.up.railway.app` |
| Railway deploy method | ✓ Git-push | Repo: `wmb81321/onix`, root dir: `/agent`, builder: Dockerfile |
| Vercel frontend | ✓ Live | Repo: `wmb81321/onix`, root dir: `/frontend`, Next.js |
| Stripe webhook | ✓ Registered | Test mode (`we_1TSOSkIeMhBdGlf7tM8ekyQI`) |
| Flow A agent (`flowA.ts`) | ✓ E2E tested | payment_intent.succeeded + transfer.paid → complete |
| Order book | ✓ Done | BUY + SELL orders, filter tabs, Realtime, Match buttons |
| Place order modal | ✓ Done | Stripe Connect required for sell, confirmation feedback |
| Trade tracker | ✓ Done | Deposit address, LinkPayButton (primary), BuyerPaymentForm (fallback), rating widget |
| Account page | ✓ Done | Balance (native hook), faucet, Stripe Connect, Stripe Link PM, auto-pay card, history |
| Ratings | ✓ Done | 1-5 stars after released/complete, updates rating_avg |
| BUY order matching | ✓ Done | Buyer/seller roles swapped correctly for BUY orders |
| P1 audit fixes | ✓ Done | stripe_payment_intent_id migration, charges_enabled check, instanceof webhook fix |
| Per-buyer Stripe Link | ✓ Done | Buyer registers own `csmrpd_...` PM ID; agent creates spend request against it |
| Per-buyer auto-pay card | ✓ Done | SetupIntent + off-session PaymentIntent fallback path |
| buyer-agent.ts | ✓ Done | Polling script: detects `deposited` trades, calls link-pay, logs approval URL |
| MCP server (`convexo-p2p-mcp`) | ✓ Done | 8-tool stdio MCP server; `npx convexo-p2p-mcp`; wraps full REST API |
| `/agents` page | ✓ Done | Developer install page — MCP snippet, tool table, example session, REST reference |
| Public `GET /api/orders` | ✓ Done | No-auth order listing; `?type=`, `?status=`, `?id=` query params |
| `settle_trade` MCP tool | ✓ Done | Crypto-native path: 0.1 USDC MPP fee = auth; no Stripe required |
| Agent API spec doc | ✗ Next | `docs/agent-api.md` — full endpoint reference for agent consumers |
| Seller agent | ✗ Next | `scripts/seller-agent.ts` — auto-deposits USDC on matched orders |
| Tempo service registry | ✗ Next | Register via Tempo developer portal (CLI has no `register` subcommand yet) |
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
| `agent/src/lib/link.ts` | Link CLI subprocess: `createSpendRequest`, `pollForApproval`, `getCard` | Railway |
| `supabase/` | SQL migrations + RLS policies (005 migrations applied) | Supabase (production) |
| `scripts/` | `buyer-agent.ts` — autonomous buyer polling agent | Local / any Node host |
| `mcp-server/` | `convexo-p2p-mcp` npm package — stdio MCP server wrapping REST API (8 tools) | npm / `npx` |
| `docs/` | Architecture references | — |
| `.claude/` | Workspace rules, slash commands, hooks | — |
| `.agents/skills/` | tempo-docs, stripe-best-practices, create-payment-credential, x402, privy | — |

### Why two deployments?

The **agent** needs a persistent long-running process (deposit monitor, Stripe webhook listener, on-chain signing). Vercel serverless functions time out and can't maintain state. The **frontend** calls the agent via `FACILITATOR_URL` (server-only env var, never `NEXT_PUBLIC_`).

---

## Stack

| Layer | Tech | Key Constraint |
|---|---|---|
| User wallet | Tempo Wallet (`tempoWallet()` wagmi connector) | Import `tempoModerato` from `viem/chains`, `tempoWallet` from `wagmi/tempo` |
| Deposits | TIP-20 Virtual Addresses | `VirtualAddress.from({ masterId, userTag: tradeId })` — userTag never reused |
| Agent wallet | Tempo master wallet + access keys | `AGENT_MASTER_ID` immutable; access keys carry `maxSpend` + `expiry` |
| Service fee | MPP session via `mppx` | `mppx.session({ amount: '0.1', unitType: 'settlement' })` |
| Buyer fiat (primary) | Stripe Link spend request | Per-buyer PM ID (`csmrpd_...`) stored in `users.link_payment_method_id` |
| Buyer fiat (fallback) | Stripe PaymentElement | SetupIntent saved card → off-session `auto-pay` endpoint |
| Seller payout | Stripe Global Payouts → Connect | Stripe API `2026-04-22.preview`; idempotency key = tradeId |
| Fiat proof | Stripe signed webhook | `constructEvent()` always; `payment_intent.succeeded` + `transfer.paid` |
| Balance reading | `Hooks.token.useGetBalance` from `wagmi/tempo` | Not `useReadContract` — native TIP-20 hook |
| Testnet faucet | `Hooks.faucet.useFundSync` from `wagmi/tempo` | In-app, no redirect, testnet only |
| Order book | Supabase Realtime + Postgres | RLS on every table; anon key in browser only |
| Frontend | Next.js 15 App Router | Service-role key never in browser bundles |
| Agent | TypeScript / Node.js | Idempotent; Supabase write before every side-effect |

---

## Database Schema (5 migrations)

| Migration | What it adds |
|---|---|
| `001_schema.sql` | `users`, `orders`, `trades`, `ratings` tables + enums |
| `002_rls.sql` | Row-level security policies |
| `003_stripe_payment_intent.sql` | `trades.stripe_payment_intent_id` |
| `004_link_fields.sql` | `trades.link_spend_request_id`, `users.link_payment_method_id` |
| `005_buyer_payment_method.sql` | `users.stripe_customer_id`, `stripe_buyer_pm_id`, `stripe_buyer_card_brand`, `stripe_buyer_card_last4` |

---

## Trade State Machine

```
created → deposited → fee_paid → fiat_sent → released → complete
```

**Agent entry points:**
- `payment_intent.succeeded` → `continueAfterFeePaid()` → `fiat_sent` (primary — both Link and card paths land here)
- `transfer.paid` → `releaseUsdcToBuyer()` → `released` → `complete`
- `POST /trades/:id/settle` (mppx 402 gate) → `continueAfterFeePaid()` (legacy / agent-native path)

**Failure states:** `deposit_timeout` (30 min), `stripe_failed`, `refunded`

All transitions write Supabase BEFORE the side-effect runs.

---

## The Flow

### SELL order match (seller posts, buyer matches)
1. Seller posts SELL order + connects Stripe account.
2. Buyer matches → agent creates trade, derives virtual deposit address.
3. Seller deposits USDC → auto-forwards to master wallet.
4. Buyer pays USD via Stripe Link spend request (or PaymentElement fallback) on `/trades/[id]`.
5. `payment_intent.succeeded` → agent sends USD to seller via Stripe transfer.
6. `transfer.paid` → agent releases USDC on-chain to buyer.
7. Both rate → `complete`.

### BUY order match (roles swapped)
- Order poster = buyer (wants USDC, will pay USD).
- Matcher = seller (deposits USDC, receives USD).
- Same agent flow from step 3 onward.

### Agentic buyer flow
1. Buyer registers Stripe Link PM ID once on `/account` (`npx @stripe/link-cli payment-methods list`).
2. Buyer runs `buyer-agent.ts` — polls Supabase for `deposited` trades.
3. Agent calls `POST /api/trades/:id/link-pay` → creates spend request against buyer's own PM.
4. Buyer (or agent) approves via `approvalUrl`.
5. Platform agent charges card, `payment_intent.succeeded` fires, USDC releases automatically.

---

## API Surface (all endpoints)

### Agent (Railway — Bearer auth required except where noted)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | Health check |
| POST | `/trades` | Bearer | Create trade + derive virtual deposit address |
| POST | `/trades/:id/link-pay` | Bearer | Create Stripe Link spend request against buyer's PM |
| POST | `/trades/:id/settle` | **public** (mppx 402) | Charge 0.1 USDC service fee → drive settlement |
| POST | `/webhooks/stripe` | public (sig verified) | Stripe webhook receiver |

### Frontend proxy (Next.js — server-side, no browser auth needed)

| Method | Path | Description |
|---|---|---|
| POST | `/api/trades` | Create trade |
| GET | `/api/trades/[id]` | Fetch trade |
| POST | `/api/trades/[id]/settle` | Forward to agent settle |
| POST | `/api/trades/[id]/link-pay` | Forward to agent link-pay |
| POST | `/api/trades/[id]/auto-pay` | Off-session charge (SetupIntent card path) |
| POST | `/api/trades/[id]/rate` | Submit rating |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/by-user` | Orders for a wallet |
| GET | `/api/trades/by-user` | Trades for a wallet |
| GET | `/api/users/me` | Fetch user payment method info |
| POST | `/api/users/upsert` | Upsert user row |
| POST | `/api/users/link-pm` | Save buyer's Stripe Link PM ID |
| DELETE | `/api/users/link-pm` | Remove buyer's Stripe Link PM ID |
| POST | `/api/stripe/account` | Create/resume Stripe Connect onboarding |
| GET | `/api/stripe/account-status` | Check Stripe Connect status |
| GET | `/api/stripe/account/refresh` | Resume abandoned Stripe onboarding |
| POST | `/api/stripe/setup-intent` | Create Stripe Customer + SetupIntent for card save |
| POST | `/api/stripe/payment-method/save` | Persist PM ID + card details after setup |

---

## Skill Trigger Table

| Skill | Activate when... |
|---|---|
| `create-payment-credential` | Stripe Link SPT code, spend request flow, Flow B |
| `stripe-best-practices` | Any Stripe API usage — webhooks, Connect, Global Payouts, SetupIntent |
| `tempo-docs` | Tempo protocol, TIP-20, Virtual Addresses, MPP, Tempo Wallet |
| `privy` | Reference only — not used in MVP |
| `x402` | HTTP 402, `mppx` middleware, MPP session/oneTime, settle endpoint |

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
| `npx @stripe/link-cli` | ✓ Authenticated | `auth status`, `payment-methods list`, `spend-request create` |

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
15. **Stripe Link PM IDs start with `csmrpd_`.** Validate this prefix before storing.
16. **`POST /trades/:id/settle` is public** — mppx 0.1 USDC payment IS the auth. Never add Bearer auth to it.
17. **`POST /trades/:id/link-pay` uses buyer's own `link_payment_method_id`** — never fall back to the platform owner's PM.

---

## After You Finish

- [ ] `CHANGELOG.md` updated
- [ ] State transitions write Supabase before side-effects
- [ ] No service-role key in client bundles
- [ ] Stripe webhook signature verification untouched
- [ ] No manual HTTP 402 implementation
- [ ] No secrets committed
- [ ] API surface table above updated if new endpoints added
