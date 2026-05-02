# /test-flow-b

Full agentic settlement test — both buyer and seller agents run without human interaction.

## What this tests

- Seller agent detects a matched order and deposits USDC automatically
- Buyer agent detects `deposited` state and initiates a Stripe Link spend request
- Spend request is approved (via `AUTO_APPROVE=1` or manual URL click)
- Platform charges buyer's card, USDC releases, trade reaches `complete`

## Pre-conditions

- `STRIPE_SECRET_KEY` starts with `sk_test_`
- Buyer has Stripe Link PM registered: `npx @stripe/link-cli payment-methods list` → `/account → Stripe Link`
- Seller has Stripe Connect account: `/account → Stripe payout → Connect`
- Agent wallet funded: `+ testnet` on Account page or `tempo wallet fund`

## Steps

### 1. Start infrastructure

```bash
# Terminal 1 — local agent
cd agent && npx tsx src/index.ts

# Terminal 2 — Stripe webhook relay
stripe listen --forward-to localhost:3001/webhooks/stripe

# Terminal 3 — frontend
cd frontend && pnpm dev
```

### 2. Create a trade via API (or UI)

```bash
# Post a SELL order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x<seller>","type":"sell","usdc_amount":10,"usd_amount":10.5,"rate":1.05}'

# Match it as buyer
curl -X POST http://localhost:3000/api/trades \
  -H "Content-Type: application/json" \
  -d '{"order_id":"<id>","buyer_address":"0x<buyer>","seller_address":"0x<seller>","usdc_amount":10,"usd_amount":10.5}'
```

### 3. Start seller agent (once seller-agent.ts exists — Phase 9)

```bash
SELLER_ADDRESS=0x... FRONTEND_URL=http://localhost:3000 \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  tsx scripts/seller-agent.ts
```

Until Phase 9, deposit manually:
```bash
tempo wallet transfer --to <virtual_deposit_address> --amount 10 --token pathUSD
```

### 4. Start buyer agent

```bash
BUYER_ADDRESS=0x... FRONTEND_URL=http://localhost:3000 \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  AUTO_APPROVE=1 tsx scripts/buyer-agent.ts
```

`AUTO_APPROVE=1` opens the Stripe Link approval URL in your browser automatically.

### 5. Watch trade complete

```bash
# Poll trade status
watch -n 2 'curl -s http://localhost:3000/api/trades/<trade_id> | jq .status'

# Expected progression:
# created → deposited → fee_paid → fiat_sent → released → complete
```

### 6. Verify USDC released on-chain

```bash
cast balance 0x<buyer_address> --rpc-url https://rpc.moderato.tempo.xyz
```

## Spend request approval (manual)

If `AUTO_APPROVE` is not set, the buyer-agent logs an approval URL:
```
[buyer-agent] Approval URL: https://link.stripe.com/spend-requests/...
```

Open this URL in a browser, click "Approve", then the agent continues automatically.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `402 — Buyer has no Stripe Link PM` | PM not registered | Go to `/account → Stripe Link → + register PM ID` |
| Trade stuck at `deposited` | Spend request not approved | Check approval URL in buyer-agent logs |
| Trade stuck at `fee_paid` | Stripe webhook not received | Check `stripe listen` is running |
| `charges_enabled: false` | Seller's Connect account incomplete | Go to `/account → Stripe payout → Complete onboarding` |
