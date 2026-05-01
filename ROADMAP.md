# Convexo P2P — Build Roadmap

## Goal
Ship a working P2P crypto↔fiat settlement app on Tempo testnet within 5 weeks,
then move to mainnet. The Agent holds USDC via virtual addresses, executes fiat
via Stripe Link, and charges 0.1 USDC per settlement via MPP.

---

## Week 1 — Foundation
**Goal:** Project boots, user can connect Tempo Wallet, order book exists in DB.

### Supabase schema
- `orders` table: id, user_address, type (buy/sell), usdc_amount, usd_amount, rate, status, created_at
- `trades` table: id, order_id, buyer_address, seller_address, usdc_amount, usd_amount, virtual_deposit_address, stripe_payout_id, status, created_at, updated_at
- `ratings` table: id, trade_id, rater_address, ratee_address, score (1-5), comment
- RLS: users can only read/write their own rows

### Next.js app scaffold
- `app/layout.tsx` — WagmiProvider with `tempoWallet()` connector
- `app/page.tsx` — landing, connect wallet button
- `app/orderbook/page.tsx` — live order book (Supabase Realtime subscription, read-only)
- Tailwind CSS setup

### Agent scaffold
- `agent/src/index.ts` — boots, connects to Supabase
- `agent/src/virtualAddresses.ts` — VirtualMaster setup script + VirtualAddress.from()

**Done when:** User can connect Tempo Wallet on the app, see an empty order book, and the virtual master setup script runs successfully on testnet.

---

## Week 2 — Orders + Deposit Flow
**Goal:** User can post an order, match it, and send USDC to a virtual deposit address.

### Order book
- `app/orderbook/page.tsx` — post buy/sell order form
- `app/api/orders/route.ts` — create/cancel order
- Real-time order list updates via Supabase Realtime

### Trade creation
- `app/api/trades/route.ts` — match order, create trade
- `agent/src/stateMachine.ts` — state transitions + Supabase writes
- Virtual deposit address derived and returned to Seller

### Deposit monitoring
- `agent/src/tempo/monitor.ts` — watch TIP-20 Transfer events for virtual addresses
- When deposit detected: trade status → `deposited`, notify both parties

**Done when:** Seller can post a sell order, Buyer matches it, Seller sees a deposit address, sends testnet USDC, and trade transitions to `deposited`.

---

## Week 3 — Stripe Integration
**Goal:** Agent can send and receive fiat via Stripe Link in test mode.

### Stripe Connect setup
- Create Stripe Connect platform account
- `app/api/stripe/onboard/route.ts` — create Stripe Connect account + Connection Session
- `app/onboard/stripe/page.tsx` — `stripe.initLinkConnection()` widget for Seller

### Stripe Global Payouts (Flow A)
- `agent/src/stripe/payouts.ts` — `POST /v2/core/accounts` + send payout
- Test mode payout to Stripe test Link account

### Stripe webhook endpoint
- `app/api/webhooks/stripe/route.ts` — `stripe.webhooks.constructEvent()`
- Dispatch `payout.paid` → agent releases USDC

### Stripe Link SPT (Flow B)
- Integrate `create-payment-credential` Stripe Link CLI skill
- `agent/src/stripe/spt.ts` — execute SPT HTTP 402 payment

**Done when:** In Stripe test mode, Agent can send a test payout to a Link account and receive the signed webhook.

---

## Week 4 — MPP Service Fee + End-to-End
**Goal:** Full Flow A and Flow B working end-to-end on testnet.

### MPP session middleware
- `npm install mppx`
- `agent/src/index.ts` — wrap settlement endpoint with `mppx.session({ amount: '0.1', unitType: 'settlement' })`
- Register agent as discoverable service on Tempo testnet

### Flow A end-to-end
- Seller deposits → Buyer matches → fee paid → Stripe payout → webhook → USDC released
- All 7 state transitions verified in Supabase

### Flow B end-to-end
- Seller deposits → Buyer authorizes SPT → Agent executes → webhook → USDC released

### Ratings
- `app/trade/[id]/page.tsx` — rate counterparty after trade complete
- `supabase/migrations/` — ratings table + aggregation view

**Done when:** Full test run of both flows passes `/test-flow-a` and `/test-flow-b` commands with no manual steps.

---

## Week 5 — Hardening + Mainnet
**Goal:** Production-ready, deployed, first real trades possible.

### Error handling + recovery
- Deposit timeout (30 min) → `deposit_timeout` state + Seller notification
- Stripe failure → `stripe_failed` + refund path (return USDC to Seller's address)
- MPP session failure → retry with exponential backoff

### Security review
- All Supabase RLS policies audited
- No service-role key in any browser code
- Stripe webhook signature verified on every call
- Access key spending caps set on Agent Tempo wallet
- `/semgrep` review pass

### Production deploy
- Next.js → Vercel
- Agent → Fly.io (persistent process for event monitoring)
- Supabase → production project
- Stripe → live mode
- Tempo → mainnet (bridge USDC via LayerZero from Base)

### Mainnet checklist
- [ ] `AGENT_MASTER_ID` set from mainnet run of `/setup-virtual-master`
- [ ] Agent access key with spending cap configured
- [ ] Stripe live mode keys set
- [ ] Stripe webhook endpoint registered (not stripe listen)
- [ ] Tempo mainnet RPC configured
- [ ] At least 2 USDC in Agent wallet as float
- [ ] Supabase RLS verified with production anon key

**Done when:** Two real humans complete a trade on mainnet.

---

## Phase 2 backlog (post-launch)
- ERC-8004 identity + on-chain reputation (when mainnet registry exists)
- Solidity escrow contract (upgrade from agent-wallet escrow for full trustlessness)
- TEE attestation (Stripe webhook verified inside TEE)
- Multi-currency support (EUR, GBP via Stripe)
- Agent-to-agent discovery (other AI agents can use Convexo as an MCP service)
- Mobile app (React Native + Wagmi mobile)
