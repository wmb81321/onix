# Convexo P2P — Project Memory

Convexo P2P is an agentic P2P crypto-fiat settlement app. An AI Agent coordinates trades between unknown counterparties using Tempo's native primitives. Crypto escrow is handled via Tempo Virtual Addresses (TIP-20 native deposit attribution that auto-forwards to a master wallet); fiat moves **directly between counterparties** (Zelle, Venmo, bank transfer, wire, etc.); the seller confirms receipt in the app and the agent then releases USDC on-chain. The 0.1 USDC service fee is charged via MPP session middleware (`mppx`) on the agent-native settle path. No Stripe, no custom Solidity, no TEE, no ERC-8004, no Privy in the MVP — Tempo Wallet, Virtual Addresses, MPP, and Supabase carry the full stack.

---

## Current Build Status (2026-05-03) — v2.0.0

**Stripe removed entirely. Manual peer-to-peer payment flow live. Frontend on Vercel, agent on Railway.**

| Layer | Status | Notes |
|---|---|---|
| Supabase schema + RLS | ✓ Live | `users`, `orders`, `trades`, `ratings` — 6 migrations applied |
| Migration 006 | ✓ Applied | New trade statuses, payment columns, `users.payment_methods` jsonb |
| Tempo Virtual Address | ✓ Registered | `AGENT_MASTER_ID=0x3ead6d3d`, on-chain Moderato testnet |
| Agent wallet (EOA) | ✓ Funded | `0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0` |
| Railway agent | ✓ Live v2.0.0 | `https://convexo-p2p-agent-production.up.railway.app` |
| Railway deploy method | ✓ Git-push | Repo: `wmb81321/onix`, root dir: `/agent`, builder: Dockerfile |
| Vercel frontend | ✓ Live | Repo: `wmb81321/onix`, root dir: `/frontend`, Next.js (commit b1b8657) |
| `flowManual.ts` | ✓ Live | `markPaymentSent()` + `confirmPayment()` |
| `POST /trades/:id/payment-sent` | ✓ Live | Buyer marks fiat sent (Bearer auth) |
| `POST /trades/:id/confirm-payment` | ✓ Live | Seller confirms receipt → USDC release (Bearer auth) |
| `POST /trades/:id/settle` | ✓ Live | Agent-native crypto path: 0.1 USDC mppx fee → marks payment_sent |
| `PaymentSentForm` component | ✓ Live | Buyer UI: method selector + reference + optional proof URL |
| `ConfirmPaymentPanel` component | ✓ Live | Seller UI: shows buyer's payment details + confirm button |
| `PaymentMethodsEditor` component | ✓ Live | Seller adds Zelle/Venmo/Wire/etc. on `/account` |
| Order book | ✓ Live | BUY + SELL orders, filter tabs, Realtime, Match buttons |
| Place order modal | ✓ Live | Min 5 USDC, balance check, "counterparties pay each other directly" copy |
| Trade tracker | ✓ Live | Deposit address, PaymentSentForm, ConfirmPaymentPanel, rating widget |
| Account page | ✓ Live | Balance (native hook), faucet, payment methods editor, order/trade history |
| Ratings | ✓ Live | 1-5 stars after released/complete, updates rating_avg |
| BUY order matching | ✓ Live | Buyer/seller roles swapped correctly for BUY orders |
| MCP server (`convexo-p2p-mcp`) | ✓ v2.0.0 | 8 tools — `mark_payment_sent`, `confirm_payment`, `settle_trade` etc. |
| `/agents` page | ✓ Live | Developer install page — MCP snippet, tool table, example session |
| Public `GET /api/orders` | ✓ Live | No-auth order listing; `?type=`, `?status=`, `?id=` query params |
| Stripe agent code | ✗ Removed | `agent/src/stripe/`, `agent/src/lib/link.ts`, `agent/src/routes/webhooks.ts`, `flowA.ts` deleted |
| Stripe frontend routes | ✗ Stubbed (410) | `/api/stripe/*`, `/api/users/link-pm`, `/api/trades/[id]/{link-pay,auto-pay,payment-intent}` |
| Stripe components | ✗ Stubbed | `BuyerPaymentForm`, `LinkPayButton`, `LinkPmSetup`, `SaveCardForm`, `StripeConnectButton` are now `export {}` |
| Stripe webhook | ✗ Removed | `we_1TSOSkIeMhBdGlf7tM8ekyQI` no longer routes to anything |
| Agent API spec doc | ✗ Next | `docs/agent-api.md` — refresh for v2.0 endpoints |
| Seller agent script | ✗ Next | `scripts/seller-agent.ts` — auto-deposit on matched orders |
| `scripts/buyer-agent.ts` | ⚠ Stale | Still calls removed `/api/trades/:id/link-pay` — needs rewrite for `payment-sent` |
| `frontend/app/stripe/` pages | ⚠ Stale | `return/`, `payment-return/` directories no longer reachable from UI |
| `agent/dist/` | ⚠ Stale | Old build artifacts (stripe/, flowA.js) — safe to `rm -rf` |
| `agent/dist/` rebuild | ⚠ Pending | `pnpm --filter agent build` to regenerate clean dist |
| Mainnet deploy | ✗ Future | Switch chain, real USDC |

---

## Folder Structure

| Folder | Purpose | Deployed to |
|---|---|---|
| `frontend/` | Next.js App Router — order book, trade tracker, account, payment forms | Vercel |
| `frontend/app/api/` | Server-side proxy routes forwarding to Railway agent (`FACILITATOR_URL`) | Vercel (server) |
| `frontend/components/` | `PaymentSentForm`, `ConfirmPaymentPanel`, `PaymentMethodsEditor`, `PlaceOrderModal`, `BalanceDisplay`, `ConnectButton`, `AgentsContent` | Vercel |
| `agent/` | TypeScript settlement runtime — HTTP server, state machine, deposit monitor | Railway (persistent) |
| `agent/src/flows/` | `flowManual.ts` — `markPaymentSent` and `confirmPayment` | Railway |
| `agent/src/routes/` | `trades.ts` — all HTTP routes (no more `webhooks.ts`) | Railway |
| `agent/src/tempo/` | `wallet.ts`, `monitor.ts`, `chain.ts`, `virtualAddresses.ts` | Railway |
| `agent/src/lib/` | `env.ts`, `mppx.ts`, `router.ts`, `schemas.ts`, `supabase.ts` (no `link.ts`) | Railway |
| `supabase/` | SQL migrations (006 applied) + RLS policies | Supabase (production) |
| `scripts/` | `buyer-agent.ts` — currently stale; rewrite pending for v2.0 | Local / any Node host |
| `mcp-server/` | `convexo-p2p-mcp` npm package — stdio MCP, 8 v2.0 tools | npm / `npx` |
| `docs/` | Architecture references | — |
| `.claude/` | Workspace rules, slash commands, hooks | — |
| `.agents/skills/` | tempo-docs, x402, plus legacy stripe-best-practices / create-payment-credential / privy (kept as reference) | — |

### Why two deployments?

The **agent** needs a persistent long-running process (deposit monitor, on-chain signing). Vercel serverless functions time out and can't maintain state. The **frontend** calls the agent via `FACILITATOR_URL` (server-only env var, never `NEXT_PUBLIC_`).

---

## Stack

| Layer | Tech | Key Constraint |
|---|---|---|
| User wallet | Tempo Wallet (`tempoWallet()` wagmi connector) | Import `tempoModerato` from `viem/chains`, `tempoWallet` from `wagmi/tempo` |
| Deposits | TIP-20 Virtual Addresses | `VirtualAddress.from({ masterId, userTag: tradeId })` — userTag never reused |
| Agent wallet | Tempo master wallet + access keys | `AGENT_MASTER_ID` immutable; access keys carry `maxSpend` + `expiry` |
| Service fee | MPP session via `mppx` | `mppx['tempo/charge']({ amount: '0.1', externalId: tradeId })` |
| Buyer fiat | **Direct counterparty payment** (Zelle/Venmo/Wire/Bank/CashApp/PayPal/Other) | Buyer marks sent with method + reference + optional proof URL |
| Seller payout | **Direct counterparty payment** | Seller confirms receipt manually; trust + ratings replace escrow |
| Release trigger | Seller-confirmed receipt | `confirmPayment()` checks `seller_address`, then transfers USDC on-chain |
| On-chain transfer | viem `transferUsdc` from agent EOA | Single-tx, sub-second finality on Tempo |
| Balance reading | `Hooks.token.useGetBalance` from `wagmi/tempo` | Not `useReadContract` — native TIP-20 hook |
| Testnet faucet | `Hooks.faucet.useFundSync` from `wagmi/tempo` | In-app, no redirect, testnet only |
| Order book | Supabase Realtime + Postgres | RLS on every table; anon key in browser only |
| Frontend | Next.js 15 App Router | Service-role key never in browser bundles |
| Agent | TypeScript / Node.js | Idempotent; Supabase write before every side-effect |

---

## Database Schema (6 migrations)

| Migration | What it adds |
|---|---|
| `001_schema.sql` | `users`, `orders`, `trades`, `ratings` tables + enums |
| `002_rls.sql` | Row-level security policies |
| `003_stripe_payment_intent.sql` | `trades.stripe_payment_intent_id` (legacy, unused in v2.0) |
| `004_link_fields.sql` | `trades.link_spend_request_id`, `users.link_payment_method_id` (legacy) |
| `005_buyer_payment_method.sql` | `users.stripe_customer_id` etc. (legacy) |
| `006_manual_payment.sql` | New trade statuses (`payment_sent`, `payment_confirmed`, `disputed`); `trades.payment_method`, `payment_reference`, `payment_proof_url`, `payment_sent_at`, `payment_confirmed_at`; `users.payment_methods` jsonb |

Legacy Stripe columns (`stripe_account`, `link_payment_method_id`, `stripe_customer_id`, `stripe_buyer_pm_id`, `stripe_buyer_card_brand`, `stripe_buyer_card_last4`, `stripe_payment_intent_id`, `link_spend_request_id`, `stripe_payout_id`, `stripe_account_id`) remain in the schema for backward compatibility but are NOT written by any v2.0 code path. They will be dropped in a future migration.

---

## Trade State Machine

```
created → deposited → payment_sent → payment_confirmed → released → complete
```

**Agent entry points:**
- `POST /trades/:id/payment-sent` (Bearer auth) → `markPaymentSent()` → `payment_sent`
- `POST /trades/:id/confirm-payment` (Bearer auth) → `confirmPayment()` → `payment_confirmed` → on-chain `transferUsdc` → `released` → `complete`
- `POST /trades/:id/settle` (public, mppx 0.1 USDC) → `markPaymentSent()` with `method='x402'`, then still requires `confirm-payment` to release USDC

**Failure states:** `deposit_timeout` (30 min), `disputed`, `refunded`

**Legacy statuses kept on the enum for backward compat with old rows:** `fee_paid`, `fiat_sent`, `stripe_failed` — never written by v2.0 code.

All transitions write Supabase BEFORE the side-effect runs.

---

## The Flow

### SELL order match (seller posts, buyer matches)
1. Seller posts SELL order on `/orderbook` (and ideally has at least one entry in `/account` → Payment Methods so the buyer sees it).
2. Buyer matches → agent creates trade, derives virtual deposit address, locks the order.
3. Seller deposits USDC to the virtual address → auto-forwards to master wallet → trade transitions to `deposited`.
4. Buyer opens `/trades/[id]`, sees the seller's payment methods (Zelle/Venmo/Wire/etc.), pays the seller off-platform with the agreed USD amount.
5. Buyer fills `PaymentSentForm` (method + reference number + optional proof URL) → `POST /api/trades/[id]/payment-sent` → trade transitions to `payment_sent`.
6. Seller opens `/trades/[id]`, sees `ConfirmPaymentPanel` with the buyer's payment details, verifies the funds arrived in their account.
7. Seller clicks "I received $X — Release USDC" → `POST /api/trades/[id]/confirm-payment` → trade transitions to `payment_confirmed` → agent transfers USDC on-chain to buyer → `released` → `complete`.
8. Both parties rate each other (1-5 stars).

### BUY order match (roles swapped)
- Order poster = buyer (wants USDC, will pay USD).
- Matcher = seller (deposits USDC, receives USD).
- Same agent flow from step 3 onward.

### Agent-native crypto path (no UI, x402)
1. Agent observes `deposited` trade via the public order/trade APIs.
2. Agent calls `POST /api/trades/:id/settle` — receives 402 with mppx challenge.
3. Agent pays 0.1 USDC via mppx, retries — agent marks `payment_sent` with `method='x402'`, `reference=tradeId`.
4. Seller (human or another agent) still needs to call `POST /trades/:id/confirm-payment` to actually release USDC. The x402 payment IS proof-of-fee but NOT proof-of-fiat-receipt.

---

## API Surface (all endpoints)

### Agent (Railway)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | public | Health check, returns `{ status: 'ok', version: '2.0.0' }` |
| POST | `/trades` | Bearer | Create trade + atomically lock the order + derive virtual deposit address + start watcher |
| POST | `/trades/:id/payment-sent` | Bearer | Buyer marks fiat as sent (`payment_method`, `payment_reference`, `payment_proof_url?`) → `payment_sent` |
| POST | `/trades/:id/confirm-payment` | Bearer | Seller confirms receipt (`seller_address`) → `payment_confirmed` → on-chain release → `complete` |
| POST | `/trades/:id/settle` | **public** (mppx 402) | Pay 0.1 USDC service fee → marks `payment_sent` with `method='x402'`. Still requires `/confirm-payment` to release USDC. |

### Frontend proxy (Next.js — server-side, no browser auth needed)

| Method | Path | Description |
|---|---|---|
| POST | `/api/trades` | Create trade (forwards to agent) |
| GET | `/api/trades/[id]` | Fetch trade from Supabase |
| POST | `/api/trades/[id]/settle` | Forward to agent settle |
| POST | `/api/trades/[id]/payment-sent` | Forward to agent payment-sent |
| POST | `/api/trades/[id]/confirm-payment` | Forward to agent confirm-payment |
| POST | `/api/trades/[id]/rate` | Submit rating (1-5 stars + optional comment) |
| GET | `/api/trades/by-user` | Trades for a wallet (service-role read) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | Public read — `?type=`, `?status=`, `?id=` |
| GET | `/api/orders/by-user` | Orders for a wallet (service-role read) |
| GET | `/api/users/me` | Fetch user payment methods + rating + trade count |
| POST | `/api/users/upsert` | Upsert user row on first wallet connect |
| POST | `/api/users/payment-methods` | Save/replace seller's payment methods array |

### Removed in v2.0 (now return 410 Gone)

`POST /api/stripe/account`, `GET /api/stripe/account-status`, `GET /api/stripe/account/refresh`, `POST /api/stripe/setup-intent`, `POST /api/stripe/payment-method/save`, `POST /api/users/link-pm`, `DELETE /api/users/link-pm`, `POST /api/trades/[id]/link-pay`, `POST /api/trades/[id]/auto-pay`, `POST /api/trades/[id]/payment-intent`. Agent route `POST /webhooks/stripe` is gone entirely (the Stripe webhook in their dashboard is dead).

---

## Skill Trigger Table

| Skill | Activate when... |
|---|---|
| `tempo-docs` | Tempo protocol, TIP-20, Virtual Addresses, MPP, Tempo Wallet |
| `x402` | HTTP 402, `mppx` middleware, MPP session/oneTime, settle endpoint |
| `supabase` | Supabase RLS, migrations, types regeneration |
| `viem-integration` / `wagmi` | Frontend chain config, on-chain reads, transfers |
| `stripe-best-practices` | NOT used in v2.0 (kept as reference only) |
| `create-payment-credential` | NOT used in v2.0 (kept as reference only) |
| `privy` | Reference only — not used in MVP |

---

## MCP + CLI Tooling

| Task | Tool | Prefix |
|---|---|---|
| Tempo protocol docs | `tempo` MCP | `mcp__tempo__*` |
| Third-party lib docs | `context7` MCP | `mcp__plugin_context7_context7__*` |
| Supabase | `supabase` plugin | `mcp__plugin_supabase_supabase__*` |
| Browser automation | `playwright` plugin | `mcp__plugin_playwright_playwright__*` |
| GitHub | `github` plugin | `mcp__github__*` |
| Vercel | `vercel` plugin | `mcp__plugin_vercel_vercel__*` |

| CLI | Auth | Key commands |
|---|---|---|
| `tempo` | Logged in — Moderato key expires 2026-05-31 | `tempo wallet fund`, `tempo wallet transfer` |
| `railway` | Logged in | `git push origin main` deploys; `railway logs` |
| `cast` | Ready | `cast send`, `cast balance` |

The `stripe` CLI and `npx @stripe/link-cli` are still installed locally but no longer needed by any production code path.

---

## Hard Rules for Claude Code

1. **`AGENT_MASTER_ID` is sacred.** Never recompute, never lose.
2. **USDC release ONLY after the seller calls `confirmPayment()` (or the trade reaches `payment_confirmed` by another verified path).** No bypass — the seller signature is the trust anchor in v2.0.
3. **Supabase state written BEFORE every on-chain side-effect.** Crash-recoverable.
4. **MPP amounts in TIP-20 stablecoins.** Never hardcode; read from `CHARGE_AMOUNT_USDC` env.
5. **The seller's address (from the trade row) is the only address allowed to call `/confirm-payment`.** `flowManual.confirmPayment` enforces this; never weaken it.
6. **Access keys carry `maxSpend` and `expiry`.** Never use master passkey programmatically.
7. **No service-role Supabase key in browser-shipped code.**
8. **Never `balanceOf(virtualAddress)`.** Watch `Transfer` events with `to === virtualAddress`.
9. **All HTTP 402 via `mppx`.** Never implement the challenge/response manually.
10. **Deposit timeout: 30 minutes.**
11. **`CHANGELOG.md` updated after every meaningful change.**
12. **`Hooks.token.useGetBalance` from `wagmi/tempo`** for TIP-20 balance reads.
13. **`Hooks.faucet.useFundSync` from `wagmi/tempo`** for testnet faucet.
14. **`POST /trades/:id/settle` is public** — mppx 0.1 USDC payment IS the auth. Never add Bearer auth to it. Note: settling marks `payment_sent`; it does NOT release USDC by itself — only `/confirm-payment` does.
15. **`POST /trades/:id/payment-sent` and `POST /trades/:id/confirm-payment` require Bearer auth** (`AGENT_API_KEY`) — always.
16. **State machine transitions are idempotent.** Re-calling `markPaymentSent` or `confirmPayment` for a trade already past that state must be a no-op, not a duplicate side-effect.
17. **No new Stripe code.** Stripe is intentionally absent. If a payment rail expansion is needed later, build it as `flowB.ts` next to `flowManual.ts` — do not resurrect `flowA.ts`.

---

## After You Finish

- [ ] `CHANGELOG.md` updated
- [ ] State transitions write Supabase before side-effects
- [ ] No service-role key in client bundles
- [ ] No new manual HTTP 402 implementation
- [ ] No secrets committed
- [ ] No Stripe imports added back to `agent/src/` or `frontend/`
- [ ] `seller_address` check in `confirmPayment` is intact
- [ ] API surface table above updated if new endpoints added
- [ ] If you removed code, the corresponding Hard Rule entry was either updated or removed
