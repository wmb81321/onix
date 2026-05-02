# Convexo P2P

Agentic P2P crypto-fiat settlement on Tempo. An AI Agent coordinates trades between unknown counterparties — using Tempo Virtual Addresses for deposit attribution, Stripe Link spend requests for P2P buyer payments, Stripe Connect for seller payouts, and MPP session middleware for service fees. No custom Solidity, no centralized exchange, no custody held by Convexo.

**Agent (Railway):** `https://convexo-p2p-agent-production.up.railway.app`
**Frontend (Vercel):** `https://convexo-p2p.vercel.app`

---

## What Works Today (v1.3.0 · Moderato Testnet)

- **Order book** — live BUY/SELL orders with Supabase Realtime; filter by All/Buy/Sell
- **Place orders** — any wallet can post a sell or buy order with USDC amount and rate
- **Match orders** — match a sell order to buy USDC, or match a buy order to sell USDC
- **Full settlement** — seller deposits USDC → buyer pays USD → USDC released on-chain
- **Stripe Connect** — sellers onboard with Express accounts to receive USD payouts
- **Stripe Link payments** — buyers register their own Stripe Link PM ID; platform creates spend requests against it; buyer (or their agent) approves
- **PaymentElement fallback** — buyers can also save a card via SetupIntent for headless off-session auto-pay
- **Trade tracker** — real-time status per trade with deposit instructions and payment UI
- **Buyer agent script** — `scripts/buyer-agent.ts` polls for deposited trades, calls link-pay, logs approval URL
- **Ratings** — both parties rate each other (1–5 stars) after settlement
- **Account page** — wallet balance, Stripe Connect status, Stripe Link PM registration, saved card, order/trade history
- **In-app testnet faucet** — one-click test USDC via Tempo faucet hook

---

## Settlement Flow

```
Seller posts SELL order (or Buyer posts BUY order)
  ↓
Counter-party matches → Agent creates trade + derives virtual deposit address
  ↓
Seller sends USDC to virtual address → auto-forwards to Agent master wallet
  ↓
Buyer pays USD via Stripe Link spend request (or PaymentElement)
     ↓ [Link path]                            ↓ [card path]
Agent creates spend request             Buyer confirms Stripe Elements
Buyer (or agent) approves via URL       payment_intent.succeeded fires
payment_intent.succeeded fires
  ↓
Agent sends USD to Seller via Stripe Connect transfer
  ↓
transfer.paid webhook (verified) → Agent releases USDC on-chain to Buyer
  ↓
Both parties rate the trade → status: complete
```

BUY orders follow the same flow with roles swapped: order poster is buyer, matcher is seller.

### Agentic buyer flow

```bash
# 1. Buyer registers their Stripe Link PM once on /account
npx @stripe/link-cli payment-methods list   # copy csmrpd_... PM ID → /account

# 2. Run buyer agent — detects deposited trades and initiates payments autonomously
BUYER_ADDRESS=0x... FRONTEND_URL=https://... \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  tsx scripts/buyer-agent.ts

# AUTO_APPROVE=1 opens approval URLs in browser automatically
```

---

## Stack

| Layer | Tech |
|---|---|
| Blockchain | Tempo (Moderato testnet, chain ID 42431) |
| Deposits | TIP-20 Virtual Addresses (per-trade, auto-forward to master) |
| Buyer payment (primary) | Stripe Link spend request (per-buyer PM, P2P) |
| Buyer payment (fallback) | Stripe PaymentElement + SetupIntent off-session |
| Seller payout | Stripe Connect Express + Global Payouts |
| Service fee | MPP session via `mppx` (0.1 USDC, charged at settle) |
| Database | Supabase Postgres + Realtime + RLS |
| Frontend | Next.js 15 App Router on Vercel |
| Agent | TypeScript / Node.js on Railway (persistent server) |
| Wallet | Tempo Wallet (`tempoWallet()` wagmi connector) |

---

## Local Dev

```bash
git clone <repo-url> convexo_p2p && cd convexo_p2p
cp .env.example .env
# Fill in keys — see .env.example for all required vars

# Agent (port 3001)
cd agent && pnpm install && npx tsx src/index.ts

# Frontend (port 3000)
cd frontend && pnpm install && pnpm dev

# Forward Stripe webhooks to local agent
stripe listen --forward-to localhost:3001/webhooks/stripe
# Paste the whsec_... output into .env as STRIPE_WEBHOOK_SECRET
```

---

## Deployment

| Service | Platform | How to deploy |
|---|---|---|
| Agent | Railway | `git push origin main` — auto-deploys (root: `/agent`, Dockerfile) |
| Frontend | Vercel | `git push origin main` — auto-deploys (root: `/frontend`, Next.js) |

```bash
railway logs --tail          # stream agent logs
railway variables set KEY=V  # set agent env var
```

---

## Folder Map

```
agent/                     TypeScript settlement runtime (Railway)
  src/flows/flowA.ts       Crypto→fiat orchestrator (state machine)
  src/routes/              HTTP route handlers (trades, webhooks)
  src/stripe/              Stripe payouts, webhook verification
  src/tempo/               Virtual addresses, deposit monitor, on-chain transfers
  src/lib/                 Env, Supabase client, mppx, router, schemas, link CLI

frontend/                  Next.js App Router (Vercel)
  app/orderbook/           Live order book with filter tabs
  app/trades/[id]/         Real-time trade tracker + payment UI + rating
  app/account/             Wallet, balance, Stripe status, Link PM setup, history
  app/api/                 Server-side proxy routes → Railway agent
  components/              ConnectButton, PlaceOrderModal, LinkPayButton,
                           BuyerPaymentForm, SaveCardForm, LinkPmSetup, etc.

scripts/                   Standalone agent scripts
  buyer-agent.ts           Autonomous buyer: polls trades, calls link-pay

supabase/                  Schema migrations (005) + RLS policies
docs/                      Architecture spec
```

---

## Testnet

```bash
# Fund wallet with test USDC (or use "+ testnet" button on Account page)
tempo wallet fund

# Check agent wallet balance
cast balance 0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0 \
  --rpc-url https://rpc.moderato.tempo.xyz
```

Stripe test mode keys (`sk_test_*`) route through Stripe sandbox. Test card: `4242 4242 4242 4242`.

---

## What's Next

- **Agent API spec** — formal OpenAPI-style reference doc for all endpoints (agent consumers)
- **Seller agent script** — symmetric to buyer-agent: auto-detects matched orders, deposits USDC via Tempo CLI
- **Full end-to-end agentic test** — both buyer and seller agents complete a trade with zero human interaction
- **Mainnet deploy** — switch `tempoModerato` → `tempo`, real USDC, live Stripe keys
- **Flow B / multi-currency** — EUR/GBP support via Stripe, additional fiat rails
