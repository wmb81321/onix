# Changelog

## [Unreleased]

## [1.0.2] — 2026-05-01
### Bug fixes — P1 audit fixes

- **`stripe_payment_intent_id` migration**: added `ALTER TABLE trades ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text` as `003_stripe_payment_intent.sql`; column was used by the payment-intent route but never existed in production schema
- **seller `charges_enabled` check**: `POST /api/trades/[id]/payment-intent` now retrieves the seller's Stripe Connect account and returns 409 if `charges_enabled` is false before creating the PaymentIntent
- **webhook error instanceof**: replaced fragile error-message regex in `agent/src/routes/webhooks.ts` with `err instanceof Stripe.errors.StripeSignatureVerificationError` for reliable 400 vs 500 discrimination

## [1.0.1] — 2026-05-01
### Bug fixes — P0/P1 audit fixes

- **env**: Fix `NEXT_PUBLI_TEMPO_PATHUSDC_ADDRESS` typo → `NEXT_PUBLIC_TEMPO_PATHUSDC_ADDRESS`; add `TEMPO_PATHUSDC_ADDRESS` for agent; add `TEMPO_RPC_URL` for agent; fix RPC URL to Moderato testnet
- **balance display**: `Hooks.token.useGetBalance` query now gated on `!!PATHUSDC` so it never fires with undefined token
- **account page orders/trades**: replaced direct browser Supabase queries (blocked by RLS) with `GET /api/orders/by-user` and `GET /api/trades/by-user` (service-role, bypasses RLS) — fixes empty order/trade history
- **orderbook page**: server-component initial fetch now uses `createServerClient()` (service-role) instead of browser anon client
- **orders API**: upsert user row before inserting order to prevent FK constraint violation on first order placement
- **agent trades route**: upsert both buyer and seller rows before inserting trade
- **deposit monitor**: watchers now run in parallel (`Promise.all`) instead of sequentially; expired deadlines are marked immediately without starting a watcher
- **stripe refresh**: added `GET /api/stripe/account/refresh` route so abandoned Stripe onboarding can resume cleanly

## [1.0.0] — 2026-05-01
### Complete — All MVP phases shipped

**Phase 5 — BUY order matching + ratings**
- **BUY order matching** — order book Match button now works on BUY orders. Matcher becomes the seller (deposits USDC, receives USD); order poster is the buyer (pays USD, receives USDC). Roles derived automatically from order type in `matchOrder()`.
- **Contextual button labels** — "Buy" on sell-order rows, "Sell" on buy-order rows for clarity.
- **Ratings** — 1–5 star widget with optional comment on trade detail page, shown after `released` or `complete`. Submits to `POST /api/trades/[id]/rate`. Upserts into `ratings` table (unique constraint on `trade_id, rater_address`), recomputes `users.rating_avg`.
- **Trade completion** — agent now advances trade to `complete` immediately after releasing USDC on-chain (no longer stuck at `released`).
- **Seller waiting state** — trade detail now shows pulsing hint to seller while buyer hasn't paid yet.
- **`database.types.ts`** — added `rating_avg` and `trade_count` to `users.Update` type.

**Phase 4 — Stripe PaymentElement + buyer payment flow**
- **`BuyerPaymentForm`** — Stripe Elements with `PaymentElement`; dark theme; fetches `clientSecret` on mount; confirms payment with redirect to `/stripe/payment-return/[tradeId]`.
- **`/api/trades/[id]/payment-intent`** — creates Stripe PaymentIntent for `usd_amount * 100 + 10` cents; idempotent (retrieves existing PI if already created); stores `stripe_payment_intent_id` on trade row.
- **`/stripe/payment-return/[id]`** — Stripe return page using `useSearchParams` inside Suspense boundary; shows success/fail state.
- **`payment_intent.succeeded` handler** — registered in `registerFlowAHandlers`; reads `trade_id` from PI metadata; calls `continueAfterFeePaid()`.
- **`continueAfterFeePaid` broadened** — accepts both `deposited` (PaymentElement path) and `fee_paid` (legacy mppx path) as valid entry states.
- **`stripe_payment_intent_id`** — added to `TradeRowSchema` (agent) and `database.types.ts` (frontend).

**Phase 3b — Account page**
- **`/account`** — wallet address (copy), USDC balance, Stripe Connect status, Stripe Link placeholder ("coming soon"), Deposit/Withdraw section, open orders table, trade history with role detection (buyer/seller).
- **Layout nav** — Order Book and Account links added to header.

**Phase 3a — Order book UI rewrite**
- **Filter tabs** — All / Buy / Sell with live counts replace the Bids/Asks two-column grid.
- **Inline toolbar** — "+ New Order" button at top-right; no more `fixed bottom-8 right-8` floating button.
- **Unified table** — Type badge (green SELL / yellow BUY), USDC, USD, Rate, action column.
- **Order placement feedback** — `placed` state in `PlaceOrderModal`; green "✓ Order placed" shown for 2s before close.

**Phase 3 — Stripe Connect for sellers**
- **`StripeConnectButton`** — checks status via `/api/stripe/account-status`; shows Connect / Complete / Connected states.
- **`/api/stripe/account`** — creates Stripe Express account without `capabilities` (onboarding handles it) and without country hardcode (any country works).
- **`/api/stripe/account-status`** — returns `{ connected, details_submitted }`.
- **upsert fix** — `/api/users/upsert` uses `ignoreDuplicates: true` to never overwrite `stripe_account` on reconnect.

**Phase 2 — Frontend API proxy routes**
- `POST /api/trades` — creates trade via agent, returns `trade_id` and `virtual_deposit_address`.
- `GET /api/trades/[id]` — fetches trade from Supabase (direct, no agent hop).
- `POST /api/trades/[id]/settle` — forwards to agent mppx 402 gate.
- `POST /api/orders` — creates order in Supabase via service-role client.

**Balance + faucet improvements**
- **`BalanceDisplay`** — switched from `useReadContract` + ERC-20 ABI to `Hooks.token.useGetBalance` from `wagmi/tempo` for reliable TIP-20 reads.
- **In-app faucet** — `Hooks.faucet.useFundSync` "+" testnet button on Account page; no redirect to wallet.tempo.xyz required.
- **`tempoxyz/docs` skill** — installed at `.agents/skills/tempo-docs` via `npx skills add tempoxyz/docs`.

## [0.7.0] — 2026-05-01
### Security — Phase 0: agent auth + atomic trade creation

- **`AGENT_API_KEY` bearer auth** — all Railway agent routes except `/health` and `/webhooks/stripe` require `Authorization: Bearer <AGENT_API_KEY>`; returns 401 otherwise.
- **Race condition fixed** — `POST /trades` atomically updates the order from `open → matched` with `WHERE status = 'open'` before creating the trade. Concurrent match returns 409.
- **`virtual_deposit_address` placeholder eliminated** — trade UUID generated client-side, virtual address derived off-chain, both written in a single atomic INSERT.

### Fixed — Vercel deployment + frontend chain config

- **`frontend/package-lock.json` deleted** — caused Vercel to switch package managers and only install 23/46 packages.
- **`frontend/vercel.json` installCommand** — `cd .. && pnpm install --frozen-lockfile`.
- **`frontend/lib/wagmi.ts` chain fixed** — `tempoModerato` (chain ID 42431) instead of `tempo` (mainnet 4217).

## [0.6.0] — 2026-05-01
### Added — Phase 1: frontend wallet auth + user provisioning

- `frontend/components/connect-button.tsx` — `tempoWallet()` connect/disconnect button; fires `POST /api/users/upsert` on first connect.
- `frontend/app/api/users/upsert/route.ts` — service-role upsert with `ignoreDuplicates: true`.
- `frontend/lib/supabase-server.ts` — service-role Supabase client for server-only routes.
- `frontend/lib/database.types.ts` — fixed `Relationships: []` and missing Views/Functions required by `@supabase/postgrest-js` v2.

## [0.5.2] — 2026-05-01
### Added / Fixed — Railway GitHub integration + Flow A E2E on production

- Railway connected to GitHub (`wmb81321/onix`, root `/agent`, Dockerfile builder).
- `agent/Dockerfile` COPY paths corrected for Railway's root dir build context.
- `MPP_SECRET_KEY` and `TEMPO_TESTNET_RPC_URL` added to Railway env.
- **Flow A E2E confirmed on Railway** — `transfer.paid` → USDC release (tx `0xb8d589db...`, Moderato).
- `frontend/vercel.json` created for Vercel GitHub integration.

## [0.5.1] — 2026-05-01
### Fixed — Flow A test run + API corrections

- `agent/src/lib/mppx.ts` — corrected mppx v0.6.8 import path (`mppx/server`); switched `tempo()` → `tempo.charge()`.
- `agent/src/routes/webhooks.ts` — fixed 400/500 status discrimination for Stripe signature errors.
- `nixpacks.toml` — empty build phase to bypass nixpacks TypeScript compilation.

## [0.5.0] — 2026-05-01
### Added — Flow A settlement agent

- `agent/src/lib/env.ts`, `schemas.ts`, `router.ts`, `mppx.ts`, `supabase.ts`
- `agent/src/tempo/wallet.ts`, `monitor.ts`, `chain.ts`, `virtualAddresses.ts`
- `agent/src/stripe/client.ts`, `payouts.ts`, `webhook.ts`
- `agent/src/flows/flowA.ts` — full crypto→fiat orchestrator
- `agent/src/routes/trades.ts`, `webhooks.ts`
- `agent/src/index.ts` — fully wired HTTP server

## [0.4.0] — 2026-05-01
### Completed — Infrastructure fully operational

- Tempo Virtual Address master registered on-chain (`AGENT_MASTER_ID=0x3ead6d3d`, block 15460573)
- Railway agent live at `https://convexo-p2p-agent-production.up.railway.app`
- Stripe webhook registered (live mode)
- Supabase schema + RLS applied to production

## [0.3.0] — 2026-05-01
### Fixed — Build errors + architecture corrections

- Node.js `createServer` instead of Bun; corrected `ox/tempo` API; `tempoWallet` from `wagmi/tempo`; `wagmi` upgraded to v3.

## [0.2.0] — 2026-04-30
### Changed — Architecture pivot

- Privy → Tempo Wallet; custom Solidity escrow → Tempo Virtual Addresses; ERC-8004/TEE/Solidity removed from MVP; MPP via `mppx` replaces custom x402 MCP.

## [0.1.0] — 2026-04-30
### Added — Initial scaffold

- CLAUDE.md, CLAUDE.local.md, mcp.json, .env.example
- `.claude/settings.json`, rules, commands, hooks
- `.agents/skills/`: stripe-best-practices, create-payment-credential, tempo-docs, privy, x402
- MCP: stripe, link, tempo, privy-docs connected
