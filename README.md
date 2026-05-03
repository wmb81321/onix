# Convexo P2P

Agentic P2P crypto-fiat settlement on Tempo. An AI Agent coordinates trades between unknown counterparties — using Tempo Virtual Addresses for USDC escrow and direct counterparty payments (Zelle, Venmo, bank transfer, etc.) for fiat. No Stripe, no custom Solidity, no centralized custody.

**Agent (Railway):** `https://convexo-p2p-agent-production.up.railway.app`  
**Frontend (Vercel):** `https://convexo-p2p.vercel.app`

---

## What Works Today (v2.0.0 · Moderato Testnet)

- **Order book** — live BUY/SELL orders with Supabase Realtime; filter by All/Buy/Sell
- **Place orders** — any wallet can post a SELL or BUY order with USDC amount and rate (min 5 USDC)
- **Match orders** — match a sell order to buy USDC, or match a buy order to sell USDC
- **Full settlement** — seller deposits USDC → buyer pays fiat directly → USDC released on-chain
- **Payment methods** — sellers register Zelle/Venmo/CashApp/bank/wire on `/account`; buyers see them on the trade page
- **Payment confirmation** — buyer marks payment sent (method + reference + optional proof URL); seller confirms receipt → USDC released
- **Trade tracker** — real-time status per trade with deposit instructions, payment forms, and progress stepper
- **Ratings** — both parties rate each other (1–5 stars) after settlement; `rating_avg` tracked per user
- **Account page** — all token balances via `wallet_getBalances`, in-app testnet faucet, payment methods editor, order/trade history
- **In-app testnet faucet** — one-click test tokens via `Hooks.faucet.useFundSync` (pathUSD + AlphaUSD + BetaUSD + ThetaUSD)
- **Agent-native settle path** — autonomous agents can call `POST /trades/:id/settle` with 0.1 USDC mppx fee; seller still confirms receipt manually
- **MCP server** — `convexo-p2p-mcp` npm package with 8 tools; any Claude agent can add it to their `mcp.json` and trade autonomously

---

## Settlement Flow

```
Seller posts SELL order (or Buyer posts BUY order)
  ↓
Counter-party matches → Agent creates trade + derives virtual deposit address
  ↓
Seller sends USDC to virtual address → auto-forwards to Agent master wallet → status: deposited
  ↓
Buyer sees seller's payment methods on /trades/[id], sends fiat off-platform
  ↓
Buyer fills PaymentSentForm (method + reference + optional proof URL) → status: payment_sent
  ↓
Seller sees ConfirmPaymentPanel with buyer's payment details, verifies fiat arrived
  ↓
Seller clicks "I received $X — Release USDC" → status: payment_confirmed
  ↓
Agent transfers USDC on-chain to buyer → status: released → complete
  ↓
Both parties rate the trade (1–5 stars)
```

BUY orders follow the same flow with roles swapped: order poster is buyer, matcher is seller.

### Agent-native path (no UI, x402)

```bash
# Autonomous agent settles their own deposited trade by paying the 0.1 USDC service fee
POST /trades/:id/settle   # mppx 402 challenge → pay 0.1 USDC → marks payment_sent
# Seller (human or agent) still confirms receipt manually
POST /trades/:id/confirm-payment  # releases USDC on-chain
```

---

## Stack

| Layer | Tech |
|---|---|
| Blockchain | Tempo (Moderato testnet, chain ID 42431) |
| USDC escrow | TIP-20 Virtual Addresses (per-trade, auto-forward to master wallet) |
| Fiat payment | **Direct counterparty** — Zelle, Venmo, CashApp, bank transfer, wire, PayPal |
| Service fee | MPP session via `mppx` (0.1 USDC, charged at `/settle`) |
| Database | Supabase Postgres + Realtime + RLS |
| Frontend | Next.js 15 App Router on Vercel |
| Agent | TypeScript / Node.js on Railway (persistent server) |
| Wallet | Tempo Wallet (`tempoWallet()` from `wagmi/connectors`) |
| Balance | `wallet_getBalances` RPC (all tokens) + `Hooks.token.useGetBalance` (settlement token) |

---

## Local Dev

```bash
git clone <repo-url> convexo_p2p && cd convexo_p2p
cp .env.example .env
# Fill in keys — see .env.example for all required vars

# Agent (port 3001)
pnpm --filter agent dev   # or: cd agent && npx tsx watch src/index.ts

# Frontend (port 3000)
pnpm --filter frontend dev  # or: cd frontend && pnpm dev
```

> HTTPS is required for WebAuthn passkeys. The frontend dev script runs with `next dev --experimental-https`. For a named `.localhost` domain, use `portless run dev`.

---

## Deployment

| Service | Platform | Trigger |
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
agent/
  src/flows/flowManual.ts    markPaymentSent() + confirmPayment() — v2.0 settlement
  src/routes/trades.ts       All HTTP route handlers (no webhooks.ts in v2.0)
  src/tempo/                 Virtual addresses, deposit monitor, on-chain transfers
  src/lib/                   env.ts, supabase.ts, mppx.ts, router.ts, schemas.ts

frontend/
  app/orderbook/             Live order book with filter tabs + match buttons
  app/trades/[id]/           Trade tracker — deposit instructions, payment forms, rating
  app/account/               Wallet, all token balances, faucet, payment methods, history
  app/api/                   Server-side proxy routes → Railway agent + Supabase reads
  components/                PaymentSentForm, ConfirmPaymentPanel, PaymentMethodsEditor,
                             PlaceOrderModal, BalanceDisplay, ConnectButton, AgentsContent
  hooks/
    use-wallet-balances.ts   wallet_getBalances hook — all token balances

scripts/
  buyer-agent.ts             Polls for deposited trades → calls payment-sent automatically

mcp-server/
  src/index.ts               convexo-p2p-mcp npm package — 8 MCP tools for agents

supabase/
  migrations/                006 migrations applied (manual payment flow, payment_methods)

docs/
  tempo/tempoSDK.md          Full Tempo Accounts SDK reference
  agent-api.md               Agent HTTP API reference (pending refresh for v2.0)
```

---

## Testnet

```bash
# Fund wallet with test tokens (or use "+ testnet" on Account page)
tempo wallet fund

# Check agent wallet balance
cast balance 0x6772787e16a7ea4c5307cc739cc5116b4b26ffc0 \
  --rpc-url https://rpc.moderato.tempo.xyz

# Testnet tokens (all 6 decimals)
# pathUSD:  0x20c0000000000000000000000000000000000000
# AlphaUSD: 0x20c0000000000000000000000000000000000001
# BetaUSD:  0x20c0000000000000000000000000000000000002
# ThetaUSD: 0x20c0000000000000000000000000000000000003
```

---

## MCP Tools (for autonomous agents)

```bash
npx convexo-p2p-mcp   # or add to mcp.json
```

| Tool | Description |
|---|---|
| `get_orders` | List open orders from the order book |
| `get_trade` | Fetch trade details and current status |
| `create_order` | Post a new SELL or BUY order |
| `match_order` | Match an existing order to create a trade |
| `mark_payment_sent` | Buyer marks fiat as sent (method + reference) |
| `confirm_payment` | Seller confirms receipt → USDC released on-chain |
| `settle_trade` | Pay 0.1 USDC mppx fee → marks payment_sent (x402 path) |
| `submit_rating` | Rate the counterparty after trade completes |

---

## What's Next

See [ROADMAP.md](./ROADMAP.md) for the full phase plan.

- **Phase 9** — Refresh `docs/agent-api.md` for v2.0 endpoints
- **Phase 10** — `scripts/seller-agent.ts` — auto-deposit on matched orders
- **Phase 11** — `scripts/e2e-agentic.ts` — full headless trade test
- **Phase 12** — Cleanup pass: drop legacy Stripe DB columns (migration 007), rebuild `agent/dist/`
- **Phase 13** — Mainnet deploy (switch chain, real USDC)
