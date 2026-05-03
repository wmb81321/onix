# p2pai — Stripe Integration Rules

> **DEPRECATED — Stripe was removed in v2.0.0 (2026-05-02).**
>
> The p2pai MVP no longer uses any Stripe product. Fiat payments are now sent
> directly between counterparties (Zelle, Venmo, bank transfer, wire, etc.); the
> seller manually confirms receipt in the app, and the agent then releases USDC
> on-chain.
>
> See:
> - `agent/src/flows/flowManual.ts` — `markPaymentSent()` and `confirmPayment()`.
> - `agent/src/routes/trades.ts` — `POST /trades/:id/payment-sent` and `POST /trades/:id/confirm-payment`.
> - `frontend/components/payment-sent-form.tsx` and `frontend/components/confirm-payment-panel.tsx`.
> - `CHANGELOG.md` v2.0.0 entry for the full removal list.
>
> Hard rule: **do not add new Stripe code.** The `agent/src/stripe/` directory,
> `agent/src/lib/link.ts`, `agent/src/routes/webhooks.ts`, and
> `agent/src/flows/flowA.ts` were intentionally deleted. Old `/api/stripe/*` routes
> in the frontend now return `410 Gone`. If a payment-rail expansion is needed in
> the future, build it as a sibling module to `flowManual.ts` (e.g. `flowB.ts`) and
> follow the state-write-before-side-effect rule in `coding-style.md` — but do not
> resurrect the v1.x Stripe code paths.
