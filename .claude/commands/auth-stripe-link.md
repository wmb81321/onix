# /auth-stripe-link

Stripe Link CLI authentication status and SPT usage guide.

## Status

**✓ Authenticated.** `npx @stripe/link-cli auth login` was completed in a prior session.

Verify:
```bash
npx @stripe/link-cli auth status
# Expected: authenticated: true
```

## What this enables (Phase 6 — Flow B)

The `mcp__link__*` tools enable Stripe Link SPT operations needed for Flow B:
- `mcp__link__spend-request_create` — create a Shared Payment Token for buyer authorization
- `mcp__link__mpp_pay` — execute an MPP payment from a Stripe Link wallet
- `mcp__link__mpp_decode` — decode an MPP payment request
- `mcp__link__payment-methods_list` — list payment methods on a Link account
- `mcp__link__onboard` — Link account onboarding for buyers

## SPT Rules

- SPTs are **single-use** — never cache, never retry a consumed token
- Store SPT lifecycle in Supabase: `created → consumed`
- Never attempt a second charge with the same SPT — it must fail cleanly
- Flow B cannot be built without this authentication

## Credentials

Stored at: `~/Library/Preferences/link-cli-nodejs/config.json`
