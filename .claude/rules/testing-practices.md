# p2pai — Testing Practices

## Flow Tests

- **`flowManual.spec.ts` is the only flow test that should exist.** It exercises `markPaymentSent()` and `confirmPayment()` against an in-memory or test Supabase project, with the on-chain `transferUsdc` call mocked at the wallet boundary.
- **Verify the seller-only invariant.** `confirmPayment(tradeId, someoneElseAddress)` MUST throw `Error("Only the seller can confirm payment receipt for trade ...")`. This is the trust anchor of v2.0 — if it ever stops failing, the test should fail loudly.
- **No Stripe test fixtures.** The `flowA.spec.ts`/`flowB.spec.ts` files were removed alongside the Stripe flow. Do not reintroduce them.

## State Machine Idempotency

- **Every transition is tested for idempotency.** Calling `markPaymentSent` or `confirmPayment` twice for the same trade must produce identical state and zero duplicate side-effects (no double `transferUsdc` call). This is enforced by the early-return guards inside each function — keep tests that verify those guards still fire.
- For `confirmPayment` specifically, the test must assert that re-invoking it after the trade reaches `released` or `complete` does NOT trigger another on-chain transfer.

## On-Chain Transfer

- **`transferUsdc` is mocked at the test boundary.** Tests assert that it is called with the expected `(buyer_address, usdc_amount)` and that Supabase is updated to `released` BEFORE the call returns. Never run flow tests against a live RPC — use the testnet only for end-to-end manual checks via the slash commands.

## HTTP Routes

- **`POST /trades/:id/payment-sent` is tested for** missing trade (404), wrong buyer address (403), wrong status (409 — e.g. trying to mark sent before deposit), and happy path (200).
- **`POST /trades/:id/confirm-payment` is tested for** wrong seller address (403), wrong status (409), and the full happy-path transition `payment_sent → payment_confirmed → released → complete`.
- **`POST /trades/:id/settle` (mppx)** is tested for the 402 challenge path and the 200 settled path. The settle endpoint marks `payment_sent`; the test must assert it does NOT release USDC on its own.

## Playwright

- **End-to-end happy path** runs against a local agent + local Supabase + Tempo Moderato testnet. Two browser contexts (seller and buyer) drive `/orderbook`, `/trades/[id]`, and `/account`. The seller deposits via the testnet faucet + virtual address; the buyer fills `PaymentSentForm`; the seller clicks `ConfirmPaymentPanel`; the test asserts the buyer's USDC balance increased on-chain.

## Coverage Gate

- **Minimum 80% line coverage on `agent/src/`** before deploy. The `pre-deploy.sh` hook enforces this.
- Coverage exclusions are limited to generated files (Supabase types, build artifacts in `agent/dist/`). Excluding business logic to hit the gate is forbidden.

## What NOT to Mock

- Never mock `confirmPayment`'s seller-address check — that's the test, not the noise around it.
- Never mock the Supabase trade row schema (`TradeRowSchema.parse`) — it catches drift between DB columns and agent expectations.
- Never mock the mppx 402 challenge path — exercise the real `Mppx.create` instance with a test secret.
