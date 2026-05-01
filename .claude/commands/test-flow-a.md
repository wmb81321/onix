# /test-flow-a

Full crypto→fiat flow on Tempo testnet + Stripe test mode.

## Pre-conditions

- `AGENT_MASTER_ID` set in `.env.local`
- Stripe test mode keys active (`STRIPE_SECRET_KEY` starts with `sk_test_`)
- Tempo testnet funded (run: `tempo wallet fund`)

## Steps

1. Start webhook relay: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
2. Start agent: `pnpm --filter agent dev`
3. Run: `pnpm --filter agent test:flow-a`
   - Creates a test trade in Supabase
   - Derives virtual deposit address for trade
   - Simulates USDC deposit to virtual address on testnet
   - Verifies deposit arrives in Agent master wallet
   - Triggers Stripe Global Payout (test mode)
   - Receives and verifies test webhook
   - Confirms USDC released to buyer address
   - Confirms trade reaches `complete` state in Supabase
4. Check Supabase dashboard — trade should show `status: complete`
