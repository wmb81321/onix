# /auth-stripe-link

Authenticate the Stripe Link CLI. Required before Flow B (Fiat→Crypto) SPT operations.

## Status

**NOT authenticated.** Must be done before implementing or testing Flow B.

## Steps

```bash
npx @stripe/link-cli auth login
```

Follow the browser prompt to connect your Stripe account. After login, verify:

```bash
npx @stripe/link-cli auth status
```

Expected output: `authenticated: true`

## What this unlocks

The `mcp__link__*` tools (already available globally) enable:
- `mpp_pay` — execute an MPP payment from a Stripe Link wallet
- `mpp_decode` — decode an MPP payment request
- `payment-methods_list` — list saved payment methods on a Link account
- `spend-request_create` — create a Shared Payment Token (SPT) for Flow B buyer authorization
- `onboard` — Link account onboarding

## Notes

- Credentials stored at `/Users/williammartinez/Library/Preferences/link-cli-nodejs/config.json`
- SPTs are single-use — never cache, never retry a consumed token
- Flow B cannot be tested without this authentication
