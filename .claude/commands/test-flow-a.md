# /test-flow-a

Full crypto→fiat flow on Tempo testnet + Stripe test mode.

## Current Architecture

Flow A is driven by Stripe webhooks:
1. Buyer pays via Stripe PaymentElement → `payment_intent.succeeded` → `continueAfterFeePaid()`
2. Stripe transfer settles → `transfer.paid` → `releaseUsdcToBuyer()` → `complete`

The mppx `POST /trades/:id/settle` route still exists as a legacy entry point.

## Pre-conditions

- Stripe test mode keys active (`STRIPE_SECRET_KEY` starts with `sk_test_`)
- Agent wallet has USDC (use `+ testnet` button on Account page or `tempo wallet fund`)
- Seller has Stripe Express account connected on the Account page

## Manual E2E Steps (via UI)

1. Start local webhook relay:
   ```bash
   stripe listen --forward-to localhost:3001/webhooks/stripe
   ```

2. Open frontend → Account → Seller wallet: click Connect Stripe, complete Express onboarding.

3. Order Book → "+ New Order" → SELL order (seller wallet).

4. Switch to buyer wallet → Order Book → click "Buy" on the sell order.

5. Trade page (`/trades/[id]`):
   - Seller: copy virtual deposit address → send USDC via Tempo Wallet or:
     ```bash
     tempo wallet transfer --to <virtual_address> --amount <usdc_amount> --token pathUSD
     ```
   - Buyer: pay USD via Stripe PaymentElement (test card: `4242 4242 4242 4242`, any expiry/CVC).

6. Watch trade advance: `deposited → fee_paid → fiat_sent → released → complete`.

7. Both parties: submit star rating on the completed trade page.

## Verify On-chain

```bash
cast balance 0x<buyer_address> --rpc-url https://rpc.moderato.tempo.xyz
# Balance should increase by trade.usdc_amount
```

## Replay Webhooks

```bash
stripe events resend evt_xxx
# or check Stripe dashboard → Webhooks → recent events
```
