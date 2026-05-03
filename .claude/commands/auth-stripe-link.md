# /auth-stripe-link — REMOVED

Stripe Link was removed in v2.0.0. The `mcp__link__*` tools and `csmrpd_...` payment methods are no longer part of the settlement flow.

Fiat payments are now made directly by the buyer (Zelle/Venmo/bank) outside the platform. The buyer then calls `mark_payment_sent` and the seller calls `confirm_payment` to drive the state machine.
