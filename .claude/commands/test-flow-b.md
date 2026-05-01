# /test-flow-b

Full fiat→crypto flow using Stripe Link SPT on testnet.

## Pre-conditions

- `AGENT_MASTER_ID` set
- Stripe test mode keys active
- Stripe Link CLI authenticated: `npx @stripe/link-cli auth login`

## Steps

1. Start webhook relay: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
2. Start agent: `pnpm --filter agent dev`
3. Run: `pnpm --filter agent test:flow-b`
   - Creates test trade
   - Simulates Seller USDC deposit via virtual address
   - Creates SPT via Stripe Link CLI (test mode)
   - Agent executes HTTP 402 payment with SPT
   - Stripe webhook fires
   - Agent releases USDC to buyer
   - Verifies SPT consumed (retry must fail cleanly)
   - Trade reaches `complete`
4. Verify SPT single-use: second run with same token must reject
