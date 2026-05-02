# /test-flow-a

Full crypto→fiat settlement flow on Tempo testnet + Stripe test mode.

## Architecture

Flow A is driven by Stripe webhooks:
1. Buyer pays via Stripe Link spend request (primary) or PaymentElement (fallback) → `payment_intent.succeeded` → `continueAfterFeePaid()`
2. Stripe transfer settles → `transfer.paid` → `releaseUsdcToBuyer()` → `complete`

The mppx `POST /trades/:id/settle` route still exists as an agent-native entry point.

## Pre-conditions

- Stripe test mode keys active (`STRIPE_SECRET_KEY` starts with `sk_test_`)
- Agent wallet has USDC (use `+ testnet` button on Account page or `tempo wallet fund`)
- Seller has Stripe Express account connected on the Account page

## Option A — UI flow (manual)

1. Start local webhook relay:
   ```bash
   stripe listen --forward-to localhost:3001/webhooks/stripe
   ```

2. Seller wallet: Account → Connect Stripe → complete Express onboarding.

3. Order Book → "+ New Order" → SELL order (seller wallet).

4. Buyer wallet → Order Book → click "Buy" on the sell order.

5. Trade page (`/trades/[id]`):
   - **Seller:** copy virtual deposit address → send USDC:
     ```bash
     tempo wallet transfer --to <virtual_address> --amount <usdc_amount> --token pathUSD
     ```
   - **Buyer (Link path):** click "Pay with Stripe Link" → approve at the displayed URL
   - **Buyer (card path):** use Stripe PaymentElement with test card `4242 4242 4242 4242`

6. Watch trade advance: `deposited → fee_paid → fiat_sent → released → complete`

7. Both parties: submit star rating.

## Option B — Agentic buyer flow

1. Buyer registers Stripe Link PM on Account page:
   ```bash
   npx @stripe/link-cli payment-methods list   # copy csmrpd_... ID → /account → Stripe Link
   ```

2. Start buyer agent:
   ```bash
   BUYER_ADDRESS=0x... FRONTEND_URL=http://localhost:3000 \
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     AUTO_APPROVE=1 tsx scripts/buyer-agent.ts
   ```

3. Match a sell order from the buyer wallet (UI or API) — agent handles the rest.

## Verify on-chain

```bash
cast balance 0x<buyer_address> --rpc-url https://rpc.moderato.tempo.xyz
# Balance should increase by trade.usdc_amount
```

## Replay webhooks

```bash
stripe events resend evt_xxx
# or Stripe dashboard → Webhooks → recent events → resend
```
