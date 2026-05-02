# Changelog

## [Unreleased]

## [1.4.0] — 2026-05-01
### Phase 8 — MCP server, /agents page, public orders GET, settle_trade tool

- **`mcp-server/`** — new `convexo-p2p-mcp` npm package: a Node.js MCP server (stdio transport) wrapping the Convexo REST API so any Claude agent can add it to their `mcp.json` and become a buyer or seller autonomously; exposes 8 tools: `list_orders`, `get_trade`, `get_my_trades`, `create_order`, `match_order`, `initiate_payment`, `settle_trade`, `get_trade_status_description`.
- **`settle_trade` tool** — crypto-native settlement path: agent pays 0.1 USDC service fee via MPP (`POST /api/trades/:id/settle`); the mppx payment IS the authorization — no Stripe, no API key required. Alternative to `initiate_payment` for on-chain-only flows.
- **`GET /api/orders`** — public read endpoint added to the existing orders route; supports `?type=`, `?status=`, and `?id=` query params; returns up to 100 orders via service-role client (bypasses RLS for public read).
- **`/agents` page** — developer-facing page (`frontend/app/agents/page.tsx` + `AgentsContent` client component) explaining how to add the MCP server, listing all 8 tools with role badges, showing an example agent conversation, and linking to the direct REST API.
- **Nav** — "For Agents" link added to the main header.

## [1.3.0] — 2026-05-01
### Phase 7b — Per-buyer Stripe Link (P2P payment infrastructure)

- **Per-buyer Link PM registration** — `LinkPmSetup` component on account page; buyer runs `npx @stripe/link-cli payment-methods list`, pastes their `csmrpd_...` ID; stored in `users.link_payment_method_id`
- **`POST /api/users/link-pm`** — saves/removes buyer's Link PM ID; validates `csmrpd_` prefix
- **Agent link-pay fixed** — removed `LINK_DEFAULT_PM_ID` platform fallback; now requires buyer's own PM; returns 402 with clear action message if not registered
- **`LinkPayButton` restored** — now targets buyer's own PM, not platform's; polls trade status every 4s to auto-advance UI on approval; shows clean approval URL for agent consumption
- **`buyer-agent.ts` updated** — calls link-pay (not auto-pay); logs spend request ID + approval URL; `AUTO_APPROVE=1` opens URL in local browser for semi-automated testing

## [1.2.0] — 2026-05-01
### Phase 7 — Agentic buyer payments (per-buyer Stripe, off-session auto-pay)

- **Removed `LinkPayButton`** — was charging platform owner's card; replaced by per-buyer card system
- **`SaveCardForm` component** — Stripe Elements SetupIntent UI on account page; saves card for future off-session charges; shows saved card brand + last4 once stored
- **`POST /api/stripe/setup-intent`** — creates (or retrieves) a Stripe Customer per buyer, returns SetupIntent `clientSecret`
- **`POST /api/stripe/payment-method/save`** — stores PM ID + card brand/last4 in `users` table after setup completes
- **`POST /api/trades/[id]/auto-pay`** — off-session charge: reads buyer's saved Customer + PM, creates `{ confirm: true, off_session: true }` PaymentIntent; `payment_intent.succeeded` triggers existing Flow A
- **`GET /api/users/me`** — returns buyer payment method details (card brand/last4) for account page display
- **`scripts/buyer-agent.ts`** — autonomous buyer agent script: polls Supabase for `deposited` trades where wallet is buyer, calls auto-pay for each; runs as a standalone loop or inside a Claude SDK agent tool
- **DB migration `005`** — `users.stripe_customer_id`, `stripe_buyer_pm_id`, `stripe_buyer_card_brand`, `stripe_buyer_card_last4`

## [1.1.0] — 2026-05-01
### Phase 6 — Stripe Link SPT buyer payment

- **`LinkPayButton`** — "Pay with Stripe Link" button on the trade detail page; creates a Link spend request server-side, shows approval URL, polls in background, confirms payment on approval; falls back to existing Stripe Elements form
- **`POST /trades/:id/link-pay`** (agent) — creates Link spend request (`card` credential type, `--test` in test mode); on approval retrieves raw card, creates Stripe PaymentMethod + confirms PaymentIntent server-side; `payment_intent.succeeded` webhook triggers existing Flow A
- **`POST /api/trades/[id]/link-pay`** (Next.js proxy) — forwards to agent with `AGENT_API_KEY` auth
- **`initLinkCli()`** — writes `LINK_CLI_AUTH` env JSON to `~/.config/link-cli-nodejs/config.json` at agent startup so the `link-cli` binary authenticates on Railway
- **Dockerfile** — adds `npm install -g @stripe/link-cli`
- **DB migration `004`** — `trades.link_spend_request_id`, `users.link_payment_method_id`
- **`LINK_CLI_AUTH`** and **`LINK_DEFAULT_PM_ID`** added to agent env schema (optional — app degrades gracefully without them)

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
