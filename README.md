# Convexo P2P

Agentic P2P crypto-fiat settlement on Tempo. An AI Agent coordinates trades between unknown counterparties — using Tempo Virtual Addresses for USDC escrow and direct counterparty payments (Zelle, Venmo, bank transfer, etc.) for fiat. No Stripe, no custom Solidity, no centralized custody.

**Agent (Railway):** `https://convexo-p2p-agent-production.up.railway.app`  
**Frontend (Vercel):** `https://convexo-p2p.vercel.app`

---

## What Works Today (v2.1.2 · Moderato Testnet)

- **Order book** — live BUY/SELL orders with Supabase Realtime; filter by All/Buy/Sell; own orders expandable with cancel button
- **Place orders** — pay 0.1 USDC service fee (mppx x402) → order created with per-order virtual deposit address; payment methods shown inline for SELL orders
- **Match orders** — match a sell order to buy USDC, or match a buy order to sell USDC
- **In-app USDC deposit** — seller taps "Send X USDC" on the trade page; `Hooks.token.useTransferSync` broadcasts the TIP-20 transfer from their connected wallet to the virtual deposit address (no copy-paste required)
- **Full settlement** — seller deposits USDC → buyer pays fiat directly → USDC released on-chain
- **Payment methods** — sellers register Zelle/Venmo/CashApp/bank/wire on `/account`; shown in Place Order modal and on the trade page so buyers know how to pay
- **Payment confirmation** — buyer marks payment sent (method + reference + optional proof URL); seller confirms receipt → USDC released on-chain
- **Trade tracker** — real-time status per trade with deposit panel, payment forms, and progress stepper
- **Ratings** — both parties rate each other (1–5 stars) after settlement; `rating_avg` tracked per user
- **Account page** — pathUSD balance via `Hooks.token.useGetBalance`, in-app testnet faucet, payment methods editor, order/trade history
- **In-app testnet faucet** — one-click test tokens via `Hooks.faucet.useFundSync`
- **Agent-native settle path** — autonomous agents can call `POST /trades/:id/settle` with Bearer auth; seller still confirms receipt manually
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

### Agent-native path (no UI, Bearer auth)

```bash
# Autonomous agent places an order (pays 0.1 USDC service fee via mppx x402)
POST /orders              # 402 challenge → pay 0.1 USDC via mppx → order created with VA

# Agent matches an order and marks payment as sent (deprecated settle path)
POST /trades/:id/settle   # Bearer auth (no fee) → marks payment_sent with method='x402'
# Seller (human or agent) still confirms receipt manually
POST /trades/:id/confirm-payment  # releases USDC on-chain
```

---

## Stack

| Layer | Tech |
|---|---|
| Blockchain | Tempo (Moderato testnet, chain ID 42431) |
| USDC escrow | TIP-20 Virtual Addresses (per-order, auto-forward to master wallet) |
| Fiat payment | **Direct counterparty** — Zelle, Venmo, CashApp, bank transfer, wire, PayPal |
| Service fee | MPP x402 via `mppx` (0.1 USDC, charged at `POST /orders`; forfeited on cancel/expiry) |
| Database | Supabase Postgres + Realtime + RLS |
| Frontend | Next.js 15 App Router on Vercel |
| Agent | TypeScript / Node.js on Railway (persistent server) |
| Wallet | Tempo Wallet (`tempoWallet()` from `wagmi/connectors`) — passkey-based, push mode for mppx |
| Balance | `Hooks.token.useGetBalance` from `wagmi/tempo` (pathUSD) |
| In-app transfer | `Hooks.token.useTransferSync` from `wagmi/tempo` (USDC deposit to virtual address) |

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
  src/flows/flowManual.ts    markPaymentSent() + confirmPayment() — manual settlement
  src/routes/orders.ts       POST /orders (mppx x402 gate) + POST /orders/:id/cancel
  src/routes/trades.ts       POST /trades, /payment-sent, /confirm-payment, /settle
  src/tempo/                 Virtual addresses, deposit monitor, on-chain transfers
  src/lib/                   env.ts, supabase.ts, mppx.ts, router.ts, schemas.ts

frontend/
  app/orderbook/             Live order book — own orders expandable/cancellable, Realtime
  app/trades/[id]/           Trade tracker — in-app deposit button, payment forms, rating
  app/account/               pathUSD balance, faucet, payment methods, order/trade history
  app/api/                   Server-side proxy routes → Railway agent + Supabase reads
  components/
    place-order-modal.tsx    mppx/client 402 payment; payment methods shown for SELL orders
    payment-sent-form.tsx    Buyer marks fiat sent (method + reference + proof URL)
    confirm-payment-panel.tsx Seller confirms receipt → USDC released on-chain
    payment-methods-editor.tsx Seller registers Zelle/Venmo/CashApp/Wire/Bank/PayPal/Other
    balance-display.tsx      pathUSD balance via Hooks.token.useGetBalance

scripts/
  buyer-agent.ts             Stale — needs rewrite for /payment-sent (was /link-pay)

mcp-server/
  src/index.ts               convexo-p2p-mcp npm package — 8 MCP tools for agents

supabase/
  migrations/                007 migrations applied (VA on orders, service_fee columns)

docs/
  tempo/tempoSDK.md          Full Tempo Accounts SDK reference
  agent-api.md               Agent HTTP API reference (pending refresh for v2.1)
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

- **Phase 9** — Refresh `docs/agent-api.md` for v2.1 endpoints
- **Phase 10** — `scripts/seller-agent.ts` — auto-deposit on matched orders
- **Phase 11** — Rewrite `scripts/buyer-agent.ts` for `/payment-sent` (was stale on removed `/link-pay`)
- **Phase 12** — `scripts/e2e-agentic.ts` — full headless trade test
- **Phase 13** — Cleanup pass: drop legacy Stripe DB columns (migration 008), rebuild `agent/dist/`
- **Phase 14** — Mainnet deploy (switch chain, real USDC)
