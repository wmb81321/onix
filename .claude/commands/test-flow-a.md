# /test-flow-a — REMOVED

This command referenced the Stripe-based Flow A settlement path, which was removed in v2.0.0.

The current settlement flow is fully manual: seller deposits USDC → buyer sends fiat directly (Zelle/Venmo/bank) → buyer marks payment sent → seller confirms receipt → agent releases USDC on-chain.

See `/test-flow-b` for the updated agentic test script, or run a trade end-to-end via the Order Book UI.
