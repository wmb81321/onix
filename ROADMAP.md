# Convexo P2P — Roadmap

## Current state: v2.0.0 (2026-05-03)

Stripe removed entirely. Direct counterparty payment flow live — buyer pays seller off-platform (Zelle/Venmo/bank/wire), seller confirms receipt, agent releases USDC on-chain. Full agentic infrastructure in place: MCP server (8 tools), x402 settle path, buyer agent script. Frontend on Vercel, agent on Railway.

Next focus: agent API spec refresh, seller agent script, end-to-end agentic test, and cleanup pass before mainnet.

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
| 8 — MCP server | v1.4.0 | `convexo-p2p-mcp` npm package (8 tools, stdio MCP), `/agents` page, public `GET /api/orders`, `settle_trade` crypto-native tool |
| **v2.0 — Direct payments** | **v2.0.0** | **Stripe removed; `flowManual.ts`; PaymentSentForm + ConfirmPaymentPanel + PaymentMethodsEditor; migration 006; MCP tools updated; buyer-agent.ts rewritten** |
| Tempo SDK alignment | v2.0.0 | `wallet_getBalances` hook (all token balances); `tempoWallet` from `wagmi/connectors`; balance display fixed (null guard + refetchInterval) |
| Dev env setup | v2.0.0 | `mppx` skill (`tempoxyz/mpp`); `tempo-docs` skill SKILL.md fixed; `mcp.json` with `tempo` + `mpp` servers; `llms.txt` endpoints documented |

---

## Phase 9 — Agent API spec refresh (next)

**Goal:** Single authoritative reference for v2.0 endpoints so any agent can integrate without reading source code.

Deliverables:
- `docs/agent-api.md` — endpoint reference: method, path, auth, request schema, response schema, state transitions triggered
- Covers: `POST /trades`, `POST /trades/:id/payment-sent`, `POST /trades/:id/confirm-payment`, `POST /trades/:id/settle`, `GET /health`
- Link from README.md

**Done when:** An agent can complete a full trade using only the API docs.

---

## Phase 10 — Seller agent script

**Goal:** `scripts/seller-agent.ts` — symmetric to `buyer-agent.ts`. Runs unattended and deposits USDC for newly matched trades.

```bash
SELLER_ADDRESS=0x... FRONTEND_URL=https://... tsx scripts/seller-agent.ts
```

Steps:
1. Poll Supabase for trades where `seller_address = SELLER_ADDRESS` and `status = created`
2. Check USDC balance (via `Hooks.token.useGetBalance` or `cast balance`)
3. Transfer exact USDC to `virtual_deposit_address` via `tempo wallet transfer` or viem
4. Poll until `status = deposited` → log

**Done when:** Seller agent deposits USDC for a matched trade with zero manual steps.

---

## Phase 11 — End-to-end agentic test

**Goal:** Full headless trade — both seller and buyer agents run unattended, trade completes.

`scripts/e2e-agentic.ts`:
1. Post SELL order via API
2. Match it from buyer address via API
3. Seller agent deposits USDC automatically
4. Buyer agent marks payment sent with reference
5. Seller agent (or human) confirms receipt → USDC released
6. Assert `status = complete` in Supabase
7. Assert buyer USDC balance increased on-chain

**Done when:** `tsx scripts/e2e-agentic.ts` passes with both agents running headlessly on testnet.

---

## Phase 12 — Cleanup pass

Remove accumulated technical debt before mainnet:

- [ ] Drop legacy Stripe DB columns (migration `007_drop_stripe_columns.sql`): `stripe_account`, `stripe_customer_id`, `stripe_buyer_pm_id`, `stripe_buyer_card_brand`, `stripe_buyer_card_last4`, `stripe_payment_intent_id`, `link_spend_request_id`, `link_payment_method_id`, `stripe_payout_id`, `stripe_account_id`
- [ ] Regenerate `frontend/lib/database.types.ts` after migration 007
- [ ] `rm -rf agent/dist/` and rebuild: `pnpm --filter agent build`
- [ ] Remove orphaned pages `frontend/app/stripe/return/` and `frontend/app/stripe/payment-return/[id]/`
- [ ] Remove stale slash commands: `.claude/commands/test-flow-a.md`, `test-flow-b.md`, `auth-stripe-link.md`
- [ ] Remove stale Railway env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LINK_CLI_AUTH`, `LINK_DEFAULT_PM_ID`
- [ ] Update `frontend/components/agents-content.tsx` stale copy (Stripe Link badge, `initiate_payment` tool name)
- [ ] Refresh `scripts/buyer-agent.ts` README section now that it's been rewritten

---

## Phase 13 — Mainnet deploy

**Prerequisites:** Phase 11 green (e2e test passes), Phase 12 clean (no stale Stripe references).

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

## Phase 14 — Post-launch backlog

**Agentic UX:**
- Spend request auto-approval flow for the x402 settle path
- Agent-to-agent discovery via Tempo service registry
- Claude SDK tool definitions with typed schemas for buyer + seller agents
- Deposit watcher recovery on agent reboot for in-flight trades

**Better trust signals:**
- Show counterparty `rating_avg` on order book (pre-match, not just post-trade)
- Dispute resolution UI — open/close disputes, capture evidence
- Time-locked refund path — if seller doesn't confirm within N hours, buyer can open dispute

**Scale:**
- Multi-instance agent with trade-level sharding for horizontal scale
- Alerting — Railway/PagerDuty on trade stuck in state > 1h

**Multi-currency fiat:**
- Dynamic FX rate from oracle instead of user-set rate
- EUR/GBP support via additional fiat rail integrations

**Mobile:**
- React Native frontend with wagmi mobile connector
