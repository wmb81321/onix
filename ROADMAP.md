# p2pai — Roadmap

## Current state: v2.2.0 (2026-05-03)

Taker fee live — both maker and taker pay 0.1 USDC via mppx push mode. Mutual cancellation with two-party consent and on-chain USDC refund shipped. Image proof upload added to PaymentSentForm. Full direct counterparty settlement flow live — buyer pays seller off-platform (Zelle/Venmo/bank/wire), seller confirms receipt, agent releases USDC on-chain. MCP server (8 tools), x402 settle path, and full frontend on Vercel + agent on Railway.

Next focus: Agent API spec refresh, then cleanup pass — clearing the path to mainnet before adding Plaid.

---

## Completed phases

| Phase | Version | What shipped |
|---|---|---|
| 0 — Security | v0.7.0 | `AGENT_API_KEY` bearer auth, atomic trade creation, trustless settle endpoint (mppx = auth) |
| 1 — Wallet auth | v0.6.0 | Tempo Wallet connect, user upsert on connect |
| 2 — API proxy | v1.0.0 | All frontend→agent proxy routes |
| 3 — Order book UI | v1.0.0 | Filter tabs, inline toolbar, unified table |
| 3b — Account page | v1.0.0 | Balance, faucet, order/trade history |
| 5 — BUY orders + ratings | v1.0.0 | BUY order matching (roles swapped), 1–5 star ratings, trade completion |
| 8 — MCP server | v1.4.0 | `p2pai-mcp` npm package (8 tools, stdio MCP), `/agents` page, public `GET /api/orders`, `settle_trade` crypto-native tool |
| v2.0 — Direct payments | v2.0.0 | Stripe removed; `flowManual.ts`; PaymentSentForm + ConfirmPaymentPanel + PaymentMethodsEditor; migration 006; MCP tools updated |
| Tempo SDK alignment | v2.0.0 | `wallet_getBalances` hook; `tempoWallet` from `wagmi/connectors`; balance display fixed |
| Dev env setup | v2.0.0 | `mppx` skill; `tempo-docs` skill; `mcp.json` with `tempo` + `mpp` servers |
| v2.1.0 — Fee at order creation | v2.1.0 | Service fee moved to `POST /orders`; per-order virtual deposit address (derived from orderId); `POST /trades/:id/settle` now Bearer-auth and fee-free |
| v2.1.1 — Open auth model | v2.1.1 | Address-in-body identity for all payment endpoints; balance hook simplified to single `usePathUsdBalance` |
| v2.1.2 — Push mode + in-app deposit | v2.1.2 | mppx push mode fix (Tempo passkey compatible); in-app USDC deposit via `Hooks.token.useTransferSync`; own-order expand/cancel in orderbook |
| v2.1.3 — Payment methods snapshot | v2.1.3 | Migration 008 (`orders.seller_payment_methods`); PaymentMethodsEditor stale state fix; Realtime subscription stability fix; payment methods shown in Place Order modal |
| v2.2.0 — Taker fee + mutual cancel + image proof | v2.2.0 | Taker fee (mppx 402 at `POST /trades`); mutual cancellation (`cancel_requested` status, confirm/reject paths, USDC refund); image proof upload (Supabase Storage); migrations 009 + 010 |

---

## Phase 9 — Agent API spec refresh

**Goal:** Single authoritative reference for v2.2 endpoints so any agent can integrate without reading source code. Fast win — no external dependencies.

**Deliverables:**
- `docs/agent-api.md` — endpoint reference: method, path, auth, request schema, response schema, state transitions triggered
- Covers all v2.2 routes: `POST /orders`, `POST /orders/:id/cancel`, `POST /trades`, `POST /trades/:id/payment-sent`, `POST /trades/:id/confirm-payment`, `POST /trades/:id/cancel`, `POST /trades/:id/reject-cancel`, `POST /trades/:id/settle`, `GET /health`
- Link from README.md

**Done when:** An agent can complete a full trade (including mutual cancel path) using only the API docs.

---

## Phase 10 — Cleanup pass

Remove accumulated technical debt before mainnet. Do this before agent scripts so the codebase is clean going into testing.

- [ ] Drop legacy Stripe DB columns (migration `011_drop_stripe_columns.sql`): `stripe_account`, `stripe_customer_id`, `stripe_buyer_pm_id`, `stripe_buyer_card_brand`, `stripe_buyer_card_last4`, `stripe_payment_intent_id`, `link_spend_request_id`, `link_payment_method_id`, `stripe_payout_id`, `stripe_account_id`
- [ ] Regenerate `frontend/lib/database.types.ts` after migration
- [ ] `rm -rf agent/dist/` and rebuild: `pnpm --filter agent build`
- [ ] Remove orphaned pages `frontend/app/stripe/return/` and `frontend/app/stripe/payment-return/[id]/`
- [ ] Remove stale slash commands: `.claude/commands/test-flow-a.md`, `test-flow-b.md`, `auth-stripe-link.md`
- [ ] Remove stale Railway env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LINK_CLI_AUTH`, `LINK_DEFAULT_PM_ID`
- [ ] Update `frontend/components/agents-content.tsx` stale copy (Stripe Link badge, `initiate_payment` tool name)
- [ ] Rewrite `scripts/buyer-agent.ts` for `/payment-sent` (was stale on removed `/link-pay`)

---

## Phase 11 — Seller agent script

**Goal:** `scripts/seller-agent.ts` — runs unattended and deposits USDC for newly matched trades.

```bash
SELLER_ADDRESS=0x... FRONTEND_URL=https://... tsx scripts/seller-agent.ts
```

Steps:
1. Poll Supabase for trades where `seller_address = SELLER_ADDRESS` and `status = created`
2. Check USDC balance (`cast balance` or Tempo RPC)
3. Transfer exact USDC to `virtual_deposit_address` via `tempo wallet transfer` or viem
4. Poll until `status = deposited` → log

**Done when:** Seller agent deposits USDC for a matched trade with zero manual steps.

---

## Phase 12 — End-to-end agentic test

**Goal:** Full headless trade — both seller and buyer agents run unattended, trade completes on testnet.

`scripts/e2e-agentic.ts`:
1. Post SELL order via API (pays maker fee)
2. Match it from buyer address via API (pays taker fee)
3. Seller agent deposits USDC automatically
4. Buyer agent marks payment sent with reference
5. Seller agent confirms receipt → USDC released
6. Assert `status = complete` in Supabase
7. Assert buyer USDC balance increased on-chain

**Done when:** `tsx scripts/e2e-agentic.ts` passes with both agents running headlessly on testnet.

---

## Phase 13 — Mainnet deploy

**Prerequisites:** Phase 12 green (e2e test passes on testnet), Phase 10 clean (no stale Stripe references).

Checklist:
- [ ] Mine new `AGENT_MASTER_ID` on Tempo mainnet (`/setup-virtual-master`)
- [ ] Fund agent wallet on mainnet (real USDC via bridge)
- [ ] Set agent access key with spending cap (`maxSpend`) on mainnet
- [ ] Switch `tempoModerato` → `tempo` (mainnet) in `frontend/lib/wagmi.ts`
- [ ] Update `TEMPO_CHAIN_ID`, `TEMPO_RPC_URL`, `NEXT_PUBLIC_TEMPO_PATHUSDC_ADDRESS` to mainnet values
- [ ] Update `NEXT_PUBLIC_TEMPO_RPC_URL` in Vercel env
- [ ] Smoke test: complete one real trade before announcing
- [ ] Register agent as a discoverable paid service via Tempo developer portal

---

## Phase 14 — Plaid bank integration

**Goal:** Let sellers and buyers optionally connect their bank account. At trade time, read the buyer's bank balance via Plaid to surface a soft trust signal — not a hard block, but a visible indicator that builds counterparty confidence.

> Apply for Plaid production API access before starting implementation — approval can take days to weeks.

**Scope:**
- Plaid Link flow for sellers and buyers to connect their bank account (optional; trade proceeds without it)
- When the buyer marks payment sent, read their bank balance via the Plaid Balance API and surface it as "Bank balance: $X available" (or "Unverified" if not connected) — visible to the seller before they confirm receipt
- Show connected bank name, account type, and masked account number on the account page
- Server-side only: Plaid `access_token` stored encrypted in Supabase; never sent to the browser
- NOT implementing ACH or any bank-initiated transfer in this phase — read-only account connection and balance reads only

**References:** [plaid/quickstart](https://github.com/plaid/quickstart) · [plaid/sandbox-custom-users](https://github.com/plaid/sandbox-custom-users) · [plaid/plaid-openapi](https://github.com/plaid/plaid-openapi)

**Deliverables:**
- `agent/src/routes/plaid.ts` — `POST /plaid/link-token`, `POST /plaid/exchange-token`, `GET /plaid/balance`
- Migration 012: `users.plaid_access_token` (text, encrypted at rest), `users.plaid_institution` (text), `users.plaid_accounts` (jsonb)
- `frontend/app/api/plaid/` — proxy routes for link-token, exchange-token, balance
- `PlaidLinkButton` component — loads Plaid Link SDK, exchanges public token, persists access token server-side
- Balance signal on `PaymentSentForm` and `ConfirmPaymentPanel`
- Account page "Connect bank" section

**Done when:** A buyer can connect their bank; `PaymentSentForm` shows their available balance; the seller sees it in `ConfirmPaymentPanel` before releasing USDC.

---

## Phase 15 — Post-launch backlog

**Agentic UX:**
- Spend request auto-approval flow for the x402 settle path
- Agent-to-agent discovery via Tempo service registry
- Claude SDK tool definitions with typed schemas for buyer + seller agents
- Deposit watcher recovery on agent reboot for in-flight trades

**Better trust signals:**
- Show counterparty `rating_avg` on order book (pre-match, not just post-trade)
- Dispute resolution UI — open/close disputes, capture evidence
- Time-locked refund path — if seller doesn't confirm within N hours, buyer can open dispute

**Extend Plaid (Phase 14 follow-on):**
- Plaid ACH transfer — actually move fiat on-platform once accounts are connected
- Balance oracle for dynamic FX validation instead of user-set rate

**Scale:**
- Multi-instance agent with trade-level sharding for horizontal scale
- Alerting — Railway/PagerDuty on trade stuck in state > 1h

**Multi-currency fiat:**
- Dynamic FX rate from oracle instead of user-set rate
- EUR/GBP support via additional fiat rail integrations

**Mobile:**
- React Native frontend with wagmi mobile connector
