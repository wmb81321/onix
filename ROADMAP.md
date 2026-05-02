# Convexo P2P — Roadmap

## Current state: v1.4.0 (2026-05-02)

All MVP phases shipped on Moderato testnet. Full agentic settlement infrastructure
in place for both buyer and seller sides. MCP server published — any Claude agent
can now add `convexo-p2p-mcp` to their `mcp.json` and trade autonomously.
Next focus: agent API spec doc, seller agent script, end-to-end agentic test.

---

## Completed phases

| Phase | Version | What shipped |
|---|---|---|
| 0 — Security | v0.7.0 | AGENT_API_KEY bearer auth, atomic trade creation (race condition fix), trustless settle endpoint (mppx = auth) |
| 1 — Wallet auth | v0.6.0 | Tempo Wallet connect, user upsert on connect |
| 2 — API proxy | v1.0.0 | All frontend→agent proxy routes |
| 3 — Stripe Connect | v1.0.0 | Seller Express onboarding, account status, refresh |
| 3a — Order book UI | v1.0.0 | Filter tabs, inline toolbar, unified table |
| 3b — Account page | v1.0.0 | Balance, faucet, Stripe status, order/trade history |
| 4 — Buyer payment | v1.0.0 | Stripe PaymentElement, PaymentIntent, return page |
| 5 — BUY orders + ratings | v1.0.0 | BUY order matching (roles swapped), 1-5 star ratings, trade completion |
| Audit P0/P1 | v1.0.1–1.0.2 | Migration 003, charges_enabled check, instanceof webhook fix |
| 6 — Stripe Link infra | v1.1.0 | Link CLI subprocess, spend request route, link-pay agent route, Dockerfile |
| 7 — Per-buyer auto-pay | v1.2.0 | SetupIntent card save, off-session auto-pay endpoint, buyer-agent.ts (card path) |
| 7b — Per-buyer Link (P2P) | v1.3.0 | Per-buyer PM ID registration, fixed link-pay (no platform fallback), LinkPayButton restored, buyer-agent.ts (Link path) |
| 8 — MCP server + agent page | v1.4.0 | `convexo-p2p-mcp` npm package (8 tools, stdio MCP), `/agents` install page, public `GET /api/orders`, `settle_trade` crypto-native tool |

---

## Phase 9 — Agent API spec (next)

**Goal:** Single authoritative reference document so any agent (Claude SDK, external script, third-party) can integrate with Convexo P2P without reading source code.

Deliverables:
- `docs/agent-api.md` — full endpoint reference (method, path, auth, request, response, state machine events triggered)
- Update `README.md` with a link to the doc

**Done when:** A developer (or Claude agent) can complete a trade end-to-end using only the docs, without reading any source code.

---

## Phase 10 — Seller agent script

**Goal:** Symmetric to `buyer-agent.ts`. Seller runs a script that monitors the order book for matched orders and automatically deposits USDC to the virtual address.

```bash
SELLER_ADDRESS=0x... FRONTEND_URL=https://... tsx scripts/seller-agent.ts
```

Steps the seller agent handles:
1. Poll Supabase for trades where `seller_address = SELLER_ADDRESS` and `status = created`
2. Check if the seller has enough USDC balance
3. Call `tempo wallet transfer` (or viem `sendTransaction`) to deposit exact USDC amount to `virtual_deposit_address`
4. Poll until trade advances to `deposited` → log

**Done when:** Seller agent runs unattended and deposits USDC for a newly matched trade without any human interaction.

---

## Phase 11 — End-to-end agentic test

**Goal:** Both seller agent and buyer agent complete a full trade with zero human touchpoints.

Test script (`scripts/e2e-agentic.ts`):
1. Post a SELL order via API
2. Match it from buyer address via API
3. Start seller-agent.ts in background → deposits USDC automatically
4. Start buyer-agent.ts in background → initiates Link spend request
5. Auto-approve spend request (via `AUTO_APPROVE=1` or Playwright)
6. Assert trade reaches `complete` in Supabase
7. Assert buyer USDC balance increased

**Done when:** `tsx scripts/e2e-agentic.ts` passes with both agents running headlessly.

---

## Phase 12 — Hardening + security pass

Before mainnet, a focused review:

- [ ] All Supabase RLS policies re-audited with fresh eyes
- [ ] No service-role key anywhere in frontend bundles (`grep -r SERVICE_ROLE frontend/`)
- [ ] Stripe webhook signature verified on every path (no bypass, no mock in prod)
- [ ] Agent access key spending caps set and tested
- [ ] Deposit timeout (30 min) tested explicitly — verify `deposit_timeout` state reached
- [ ] Refund path tested — agent wallet sends USDC back to seller on `refunded`
- [ ] Rate limiting on `POST /trades` (prevent order spam)
- [ ] `stripe_payment_intent_id` idempotency — two concurrent auto-pay calls for same trade return existing PI

---

## Phase 13 — Mainnet deploy

**Prerequisites:** Phase 11 green (agentic test passes), Phase 12 clean (security pass).

Checklist:
- [ ] Mine new `AGENT_MASTER_ID` on Tempo mainnet (`/setup-virtual-master`)
- [ ] Fund agent wallet on mainnet (real USDC via bridge or direct)
- [ ] Set agent access key with spending cap on mainnet
- [ ] Switch `TEMPO_RPC_URL` to mainnet, `TEMPO_CHAIN_ID` to `4217`
- [ ] Switch frontend chain from `tempoModerato` to `tempo` in `wagmi.ts`
- [ ] Switch Stripe to live mode keys (`sk_live_...`)
- [ ] Register Stripe live webhook endpoint (not `stripe listen`)
- [ ] Update `NEXT_PUBLIC_TEMPO_PATHUSDC_ADDRESS` for mainnet USDC address
- [ ] Smoke test: complete one real trade before announcing
- [ ] Set Railway to production env, Vercel to production env

---

## Phase 14 — Post-launch backlog

**Multi-currency fiat:**
- EUR/GBP support via Stripe (additional Connect payout currencies)
- Dynamic rate from exchange API instead of user-set rate

**Better agentic UX:**
- Claude SDK tool definitions for buyer and seller agents (proper tool schemas)
- Spend request auto-approval via Playwright / Stripe Link SDK when available
- Agent-to-agent discovery — register Convexo agent as an MCP service so other Claude agents can find and use it

**Scale + reliability:**
- Deposit watcher recovery — restart watchers on agent reboot for in-flight trades
- Multi-instance agent (trade-level sharding) for horizontal scale
- Alerting — Railway/PagerDuty on webhook failures, trade stuck in state > 1h

**Reputation:**
- ERC-8004 or equivalent on-chain reputation registry
- Show counterparty rating on order book (not just post-trade)

**Mobile:**
- React Native frontend with Wagmi mobile
