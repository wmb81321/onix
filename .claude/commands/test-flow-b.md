# /test-flow-b — REMOVED

This command referenced the Stripe-based Flow B agentic path (Stripe Link spend requests, buyer-agent.ts), which was removed in v2.0.0.

The current settlement flow is fully manual: seller deposits USDC → buyer sends fiat directly (Zelle/Venmo/bank) → buyer marks payment sent → seller confirms receipt → agent releases USDC on-chain.

For agentic testing, use the MCP tools `mark_payment_sent` and `confirm_payment` directly via the `p2pai-mcp` server.
