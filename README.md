# Convexo P2P

Agentic P2P crypto-fiat settlement on Tempo. An AI Agent coordinates trades between unknown counterparties — using Tempo Virtual Addresses for deposit attribution, Stripe Link for fiat, and MPP session middleware for service fees. No custom Solidity, no centralized exchange, no custody held by Convexo.

**Agent (testnet):** `https://convexo-p2p-agent-production.up.railway.app`

## Settlement Flows

**Flow A — crypto to fiat**
- Seller deposits USDC to a per-trade Tempo Virtual Address (auto-forwards to Agent master)
- Buyer pays 0.1 USDC service fee via MPP session, then authorizes a Stripe Link SPT
- Agent pushes USD to Seller via Stripe Global Payouts; signed webhook verified
- Agent releases USDC from master to Buyer's Tempo address

**Flow B — fiat to crypto**
- Seller deposits USDC to virtual address; Buyer pays MPP fee
- Buyer authorizes SPT; Agent debits Buyer's Stripe Link, credits Seller's Link
- Stripe webhook (signed) confirms; Agent releases USDC to Buyer's Tempo address
- Both parties rate the trade

## Stack

Tempo · Stripe Link · x402/MPP (`mppx`) · Supabase · Next.js

## Quick Start

> Infrastructure is already running on testnet. These steps are for local dev only.

```bash
git clone <repo-url> convexo_p2p
cd convexo_p2p
pnpm install
# .env already contains all required keys (Stripe live, Supabase, Tempo, agent wallet)
pnpm dev                              # boots Next.js app + agent
```

Forward Stripe webhooks to the local agent:

```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
# Copy the printed whsec_... into .env as STRIPE_WEBHOOK_SECRET
```

## Folder Map

- `app/` — Next.js App Router: order book UI, Tempo Wallet connector, trade tracker
- `agent/` — TypeScript settlement runtime: MPP server, state machine, deposit monitor
- `mcp-servers/` — project MCPs: `stripe-payouts/`, `x402-mpp/`
- `supabase/` — schema migrations, RLS policies
- `docs/` — `agenticp2p.md` and architecture references

## Testnet

- Free stablecoins: `tempo wallet fund` (pathUSD / alphaUSD / betaUSD / thetaUSD)
- Stripe test mode: keys starting with `sk_test_` route through Stripe's sandbox
- Run `/test-flow-a` and `/test-flow-b` slash commands for end-to-end coverage

## Architecture

Full system architecture, message flows, and trust model: [`docs/agenticp2p.md`](./docs/agenticp2p.md).
