---
name: X402
description: Use when building payment-enabled APIs, integrating crypto payments into services, creating AI agent-accessible paid endpoints, or implementing usage-based billing. Agents should reach for this skill when they need to add HTTP 402 payment requirements to services, create clients that pay for API access, or discover and integrate with paid services.
metadata:
    mintlify-proj: x402
    version: "1.0"
---

# x402 Skill Reference

## Product Summary

x402 is an open payment standard that enables services to charge for API access directly over HTTP using the `402 Payment Required` status code. It supports crypto-native payments (USDC on Base and Solana) with zero protocol fees, ~1 second settlement, and no account creation. Agents use x402 to build payment-enabled APIs (sellers), make paid requests (buyers), or discover services through the Bazaar discovery layer.

**Key files and concepts:**
- **Payment headers:** `PAYMENT-REQUIRED` (server → client), `PAYMENT-SIGNATURE` (client → server), `PAYMENT-RESPONSE` (server → client)
- **Network identifiers:** CAIP-2 format (e.g., `eip155:8453` for Base mainnet, `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` for Solana mainnet)
- **Payment schemes:** `exact` (fixed price) or `upto` (usage-based, EVM only)
- **Facilitators:** Optional services that verify and settle payments on-chain (e.g., `https://api.cdp.coinbase.com/platform/v2/x402`)
- **SDK packages:** `@x402/express`, `@x402/next`, `@x402/fetch`, `@x402/axios` (TypeScript); `x402` (Python); `github.com/x402-foundation/x402/go` (Go)

**Primary docs:** https://docs.x402.org

## When to Use

Reach for this skill when:

- **Building a paid API** — Add payment middleware to protect endpoints and receive USDC payments
- **Creating an AI agent** — Register payment schemes and make requests to paid services automatically
- **Implementing usage-based billing** — Use the `upto` scheme to charge only for actual usage (tokens, compute, bandwidth)
- **Discovering paid services** — Query the Bazaar to find and integrate with x402-compatible endpoints or MCP tools
- **Handling payment verification** — Verify client signatures and settle transactions via a facilitator
- **Multi-network support** — Register schemes for EVM (Base) and SVM (Solana) on the same endpoint
- **Building MCP tools** — Wrap Model Context Protocol tools with payment requirements for agent discovery

## Quick Reference

### Payment Schemes

| Scheme | Use Case | Networks | Behavior |
|--------|----------|----------|----------|
| `exact` | Fixed-price endpoints | EVM, SVM, Stellar, Aptos, Algorand | Client pays exact advertised price |
| `upto` | Usage-based billing | EVM only | Client authorizes max; server settles actual usage |

### Network Identifiers (CAIP-2)

| Network | ID | Status |
|---------|----|----|
| Base Mainnet | `eip155:8453` | Production |
| Base Sepolia | `eip155:84532` | Testnet |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Production |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | Testnet |

### Facilitator URLs

| Environment | URL |
|-------------|-----|
| Testnet (Base Sepolia, Solana Devnet) | `https://x402.org/facilitator` |
| Mainnet (Coinbase) | `https://api.cdp.coinbase.com/platform/v2/x402` |
| Mainnet (PayAI) | `https://facilitator.payai.network` |

### SDK Packages by Language

**TypeScript:**
- `@x402/express`, `@x402/next`, `@x402/hono`, `@x402/fastify` (servers)
- `@x402/fetch`, `@x402/axios` (clients)
- `@x402/evm`, `@x402/svm`, `@x402/aptos`, `@x402/avm`, `@x402/stellar` (payment schemes)

**Python:**
- `x402[fastapi]`, `x402[flask]` (servers)
- `x402[httpx]`, `x402[requests]` (clients)
- `x402[svm]` (Solana support)

**Go:**
- `github.com/x402-foundation/x402/go` (all functionality)

## Decision Guidance

### When to Use `exact` vs `upto`

| Condition | Use `exact` | Use `upto` |
|-----------|------------|-----------|
| Fixed price per call | ✅ | — |
| Variable cost (tokens, compute time) | — | ✅ (EVM only) |
| Need multi-network support | ✅ | — |
| Simple integration | ✅ | — |
| Transparent billing | ✅ | ✅ |

### When to Use a Facilitator vs Local Verification

| Scenario | Facilitator | Local |
|----------|-----------|-------|
| Reduce operational complexity | ✅ | — |
| Avoid blockchain node setup | ✅ | — |
| Verify signatures locally | — | ✅ |
| Settle payments directly | — | ✅ |
| Solana duplicate settlement protection | ✅ (built-in) | ⚠️ (must implement cache) |

### When to Use Bazaar Discovery

| Use Case | Bazaar | Hardcoded |
|----------|--------|-----------|
| AI agents discovering services | ✅ | — |
| Dynamic service integration | ✅ | — |
| Fixed integrations | — | ✅ |
| Internal APIs | — | ✅ |

## Workflow

### For Sellers (Building a Paid API)

1. **Choose your framework** — Express, Next.js, Hono, Fastify (TypeScript); FastAPI, Flask (Python); Gin, Echo, net/http (Go)
2. **Install x402 packages** — Add `@x402/express` (or equivalent) and mechanism packages (`@x402/evm`, `@x402/svm`)
3. **Create a facilitator client** — Point to testnet (`https://x402.org/facilitator`) or mainnet facilitator
4. **Register payment schemes** — Register `ExactEvmScheme`, `ExactSvmScheme`, etc. on the resource server
5. **Define protected routes** — Specify `accepts` (payment options), `price`, `network`, `payTo` (your wallet), `description`, `mimeType`
6. **Add payment middleware** — Wrap your app with `paymentMiddleware` or equivalent
7. **Implement your handler** — Your business logic runs after payment verification
8. **Test on testnet** — Make requests without payment, verify 402 response, complete payment, retry with `PAYMENT-SIGNATURE`
9. **Deploy to mainnet** — Update facilitator URL and network identifiers to mainnet
10. **(Optional) Add Bazaar** — Include `bazaar` extension in route config for service discovery

### For Buyers (Making Paid Requests)

1. **Create a wallet signer** — Load private key into `viem`, `eth-account`, or `@solana/kit`
2. **Create an x402 client** — Instantiate `x402Client()` and register schemes (`ExactEvmScheme`, `ExactSvmScheme`)
3. **Wrap your HTTP client** — Use `wrapFetchWithPayment`, `wrapAxiosWithPayment`, or `WrapHTTPClientWithPayment`
4. **Make requests** — Call the wrapped client; payment is handled automatically on 402 responses
5. **(Optional) Discover services** — Query Bazaar `/discovery/resources` endpoint to find services
6. **Handle errors** — Catch "No scheme registered" (unsupported network) or "Payment already attempted" (failed retry)

### For Discovering Services (Bazaar)

1. **Create a facilitator client** — Point to a facilitator with Bazaar support
2. **Extend with Bazaar** — Call `withBazaar(facilitatorClient)` or equivalent
3. **List or search** — Call `listResources({ type: "http" })` or `search({ query: "..." })`
4. **Filter by price/network** — Check `accepts` array for affordable options
5. **Call the service** — Use a payment-enabled client to make the request

## Common Gotchas

- **Testnet vs mainnet mismatch** — Ensure network identifiers match (e.g., `eip155:84532` for testnet, `eip155:8453` for mainnet). Testnet USDC is different from mainnet USDC.
- **Exact scheme requires exact amount** — No overpayment or underpayment allowed. The `amount` in your signature must exactly match the server's requirement.
- **Missing scheme registration** — If a server requires a network you haven't registered, the client will throw "No scheme registered". Register all networks you plan to support.
- **Solana duplicate settlement** — If settling Solana payments directly (not via facilitator), implement a 120-second cache to prevent the same transaction from being submitted twice.
- **Payment already attempted** — If a request fails payment verification, the client won't retry automatically. You must create a new request.
- **Facilitator URL matters** — Different facilitators may support different networks or have different discovery catalogs. Verify your facilitator supports your target network.
- **Private key exposure** — Never hardcode private keys. Use environment variables or secure key management. Buyers should sign locally; sellers never hold buyer keys.
- **Gas fees on mainnet** — Mainnet transactions require ETH for gas. Fund wallets with a small amount of ETH before testing.
- **MCP tool discovery** — MCP tools are identified by the tuple `(resource_url, tool_name)`, not just the URL. Multiple tools can be served from one endpoint.
- **Upto scheme limitations** — Only available on EVM networks. When using `upto`, call `setSettlementOverrides` in your handler to specify actual usage.

## Verification Checklist

Before submitting work:

- [ ] **Testnet tested** — Verified 402 response, payment signature, and successful settlement on testnet
- [ ] **Network identifiers correct** — Using CAIP-2 format (e.g., `eip155:84532`, not `base-sepolia`)
- [ ] **Schemes registered** — All required payment schemes registered on the resource server
- [ ] **Facilitator URL valid** — Testnet uses `https://x402.org/facilitator`; mainnet uses production facilitator
- [ ] **Wallet addresses correct** — `payTo` address is correct and matches your receiving wallet
- [ ] **Payment headers present** — Responses include `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE` headers
- [ ] **Error handling** — Client catches "No scheme registered" and "Payment already attempted" errors
- [ ] **Mainnet ready** — Facilitator URL and network IDs updated for production
- [ ] **Bazaar metadata** — If using Bazaar, descriptions and schemas are clear and accurate
- [ ] **No hardcoded keys** — Private keys loaded from environment variables, not source code

## Resources

**Comprehensive navigation:** https://docs.x402.org/llms.txt

**Critical pages:**
1. [HTTP 402 Concept](https://docs.x402.org/core-concepts/http-402) — Understand the protocol foundation
2. [Quickstart for Sellers](https://docs.x402.org/getting-started/quickstart-for-sellers) — Build a payment-enabled API
3. [Quickstart for Buyers](https://docs.x402.org/getting-started/quickstart-for-buyers) — Make paid requests

**Community:** [Discord](https://discord.gg/cdp) | [GitHub](https://github.com/x402-foundation/x402)

---

> For additional documentation and navigation, see: https://docs.x402.org/llms.txt