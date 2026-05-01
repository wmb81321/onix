# Convexo P2P — Stripe Integration Rules

## Webhook Verification

- **Always verify with `stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)`.** Reject the request if `constructEvent` throws — return 400 and do not process the event.
- The TEE is the only component that calls `constructEvent`. The agent runtime trusts only TEE-signed attestations, not raw Stripe events.
- **Never compare signatures manually** with string equality — Stripe's helper does timing-safe comparison.

## API Version

- **Stripe API version is pinned to `2026-04-22.preview`** (required for v2/core/accounts and Global Payouts). Set via `new Stripe(secret, { apiVersion: "2026-04-22.preview" })` and via the `Stripe-Version` header on raw HTTP calls.

## Global Payouts (Flow A)

- **Recipient accounts must request the `link` capability** when created via `accounts.create`.
- **Always include `identity.country`** on the recipient account — Colombia uses `"CO"`. Missing country causes Stripe to reject payout method linking.

## Connection Sessions (Link onboarding)

- **`allowed_connection_types: ["link"]`** — never an empty list, never include other types we don't support.
- **`requested_access: ["payout_methods"]`** — exactly this scope for Flow A. Do not request additional scopes that aren't used.

## Shared Payment Tokens (Flow B)

- **SPTs are one-time-use.** Treat consumed tokens as terminal — never cache, retry, or replay a consumed SPT. A second attempt must fail cleanly with a specific error type.
- Store SPT lifecycle in Supabase (`created`, `consumed`, `expired`) and refuse to use any SPT not in `created` state.

## Stripe-Context Header

- **Always pass `Stripe-Context: <recipient_account_id>`** when listing payout methods or operating on a connected recipient. Missing context returns the platform-level view, not the recipient's.

## Restricted Keys

- **Production uses Stripe restricted keys with the minimum capability set** — never the full secret key. The agent's restricted key needs: `payouts:write`, `accounts:read`, `webhook_endpoints:read`, `payment_methods:read`.
- **Never expose any Stripe secret in frontend code.** Frontend uses the publishable key only. Server-side calls go through the agent or Next.js route handlers.
