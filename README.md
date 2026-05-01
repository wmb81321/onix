# Convexo P2P

Agentic P2P crypto-fiat settlement on Tempo. An AI Agent coordinates trades between unknown counterparties — using Tempo Virtual Addresses for deposit attribution, Stripe for fiat, and MPP session middleware for service fees. No custom Solidity, no centralized exchange, no custody held by Convexo.

**Agent (Railway):** `https://convexo-p2p-agent-production.up.railway.app`  
**Frontend (Vercel):** `https://convexo-p2p.vercel.app` (auto-deployed on push to `main`)

## What Works Today (Moderato Testnet)

- **Order book** — live BUY/SELL orders with Supabase Realtime; filter by All/Buy/Sell
- **Place orders** — any wallet can post a sell or buy order with USDC amount and rate
- **Match orders** — match a sell order to buy USDC, or match a buy order to sell USDC
- **Full Flow A** — seller deposits USDC → buyer pays USD via Stripe → USDC released on-chain
- **Stripe Connect** — sellers onboard with Express accounts to receive USD payouts
- **Trade tracker** — real-time status page per trade with deposit instructions and payment form
- **Ratings** — both parties rate each other (1–5 stars) after settlement
- **Account page** — wallet balance, Stripe Connect status, order history, trade history
- **In-app testnet faucet** — one-click test USDC funding via Tempo faucet hook

## Settlement Flow

```
Seller posts SELL order → Buyer matches
  ↓
Agent creates trade, derives virtual deposit address
  ↓
Seller sends USDC to virtual address → auto-forwards to Agent master wallet
  ↓
Buyer pays USD via Stripe PaymentElement
  ↓
Stripe payment_intent.succeeded webhook (verified) → Agent sends USD to Seller
  ↓
Stripe transfer.paid webhook (verified) → Agent releases USDC on-chain to Buyer
  ↓
Both parties rate the trade → status: complete
```

BUY orders follow the same flow with roles swapped: the order poster is the buyer, the matcher is the seller who deposits USDC.

## Stack

| Layer | Tech |
|---|---|
| Blockchain | Tempo (Moderato testnet, chain ID 42431) |
| Deposits | TIP-20 Virtual Addresses (per-trade, auto-forward to master) |
| Fiat | Stripe PaymentElement (buyer) + Stripe Connect (seller payouts) |
| Service fee | MPP session via `mppx` (0.1 USDC, charged at settle) |
| Database | Supabase Postgres + Realtime + RLS |
| Frontend | Next.js 15 App Router on Vercel |
| Agent | TypeScript / Node.js on Railway (persistent server) |
| Wallet | Tempo Wallet (`tempoWallet()` wagmi connector) |

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

## Deployment

| Service | Platform | How to deploy |
|---|---|---|
| Agent | Railway | `git push origin main` — GitHub integration auto-deploys (root: `/agent`, Dockerfile) |
| Frontend | Vercel | `git push origin main` — GitHub integration auto-deploys (root: `/frontend`, Next.js) |

```bash
railway logs --tail          # agent logs
railway variables set KEY=V  # set agent env var
```

## Folder Map

```
agent/                  TypeScript settlement runtime (Railway)
  src/flows/flowA.ts    Crypto→fiat orchestrator (state machine)
  src/routes/           HTTP route handlers (trades, webhooks)
  src/stripe/           Stripe payouts, webhook verification
  src/tempo/            Virtual addresses, deposit monitor, on-chain transfers
  src/lib/              Env, Supabase client, mppx, router, schemas

frontend/               Next.js App Router (Vercel)
  app/orderbook/        Live order book with filter tabs
  app/trades/[id]/      Real-time trade tracker + payment form + rating
  app/account/          Wallet, balance, Stripe status, history
  app/api/              Server-side proxy routes → Railway agent
  components/           ConnectButton, PlaceOrderModal, BuyerPaymentForm, etc.

supabase/               Schema migrations + RLS policies
docs/                   Architecture spec (agenticp2p.md)
```

## Testnet

```bash
# Fund wallet with test USDC (or use "+ testnet" button on Account page)
tempo wallet fund

# Check agent wallet balance
cast balance 0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0 --rpc-url https://rpc.moderato.tempo.xyz
```

Stripe test mode keys (`sk_test_*`) route through Stripe sandbox — no real money moves.

## What's Next

- **Stripe Link SPT** — buyer pre-authorizes payment via Stripe Link credential (replaces PaymentElement for Flow B)
- **Flow B** — fiat-to-crypto direction via SPT pull from buyer's Stripe Link
- **Mainnet deploy** — switch Tempo chain, real USDC, live Stripe keys
