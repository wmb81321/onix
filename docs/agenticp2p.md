# Agentic P2P Crypto ↔ Fiat Settlement Protocol

> **Purpose.** This document is the authoritative architecture spec **and** the
> Claude Code scaffolding prompt for this workspace. Read it top-to-bottom before
> generating any code. It replaces the earlier Belvo/PSE design now that
> **Stripe Global Payouts → Link** and **Stripe Link `create-payment-credential`**
> are available — fiat verification is no longer a heuristic, it is a signed
> webhook.

---

## 1. Project description (one paragraph)

A fully agentic, trustless P2P protocol where two unknown parties exchange
**crypto for fiat (or fiat for crypto)** without a centralized exchange.
An AI **Agent** sits in the middle as a neutral programmatic coordinator: it
holds escrow on **Tempo** (TIP-20 stablecoins), executes the fiat leg through
**Stripe Link** (Global Payouts for crypto→fiat, `create-payment-credential` /
SPT for fiat→crypto), verifies settlement via a **cryptographic Stripe webhook**
inside a **TEE**, posts the attestation to the **ERC-8004 Validation Registry**,
and triggers escrow release. The Agent monetizes itself through **x402 / HTTP 402**
on Tempo (0.1 USDC per settlement), publishes its **ERC-8004 identity** for
discovery, and accumulates an on-chain reputation score with every trade. No
screenshots, no bank polling, no trusted operator.

---

## 2. The two settlement flows

### Flow A — Crypto → Fiat

> Seller has crypto on Tempo, Buyer wants crypto and pays fiat (USD/COP) from a
> Stripe Link account. Agent pushes USD to Buyer's Link account.

| # | Step | System |
|---|------|--------|
| 1 | Buyer posts a buy order (`amount`, `rate`, `currency`) to the order book | Supabase (Realtime) |
| 2 | Seller matches the order; Agent creates the trade record (`status=created`) | Agent + Supabase |
| 3 | Agent challenges Buyer with HTTP 402 for the **0.1 USDC** service fee | x402 / MPP on Tempo |
| 4 | Buyer pays the fee; Agent verifies receipt; trade → `status=fee_paid` | Tempo wallet + Agent |
| 5 | Seller locks the crypto in the escrow contract (`lock(tradeId, amount, buyer)`) | Tempo escrow contract |
| 6 | Agent calls `POST /v2/core/accounts` + Connection Session if Buyer's Link account isn't linked yet | Stripe Global Payouts MCP |
| 7 | Agent calls **Stripe Global Payouts** → USD lands in Buyer's Link account (recipient `country: "CO"` allowed) | Stripe |
| 8 | Stripe fires a **signed webhook** (`payout.paid`) to the Agent's webhook endpoint | Stripe |
| 9 | TEE verifies the **webhook signature** (HMAC-SHA256 with `STRIPE_WEBHOOK_SECRET`), checks `payout.id` and `amount` match the trade | TEE attestor |
| 10 | TEE calls `validationResponse(tradeHash, ATTESTED)` on the ERC-8004 Validation Registry | ERC-8004 Validation Registry |
| 11 | Anyone (Buyer, Seller, Agent) calls `release(tradeId)`; escrow reads `getValidationStatus(tradeHash) == ATTESTED` and **releases crypto to Buyer** | Tempo escrow contract |
| 12 | Both parties call `giveFeedback(counterpartyAgentId, score, uri)` | ERC-8004 Reputation Registry |

### Flow B — Fiat → Crypto

> Buyer has fiat in a Stripe Link wallet, wants crypto. Buyer pre-authorizes the
> Agent to spend, Agent pulls fiat into Seller's Link account, Buyer gets crypto.

| # | Step | System |
|---|------|--------|
| 1 | Seller posts a sell order (`amount`, `rate`, `currency`) | Supabase |
| 2 | Buyer matches the order; Agent creates the trade record | Agent + Supabase |
| 3 | Agent challenges Buyer for the **0.1 USDC** service fee via HTTP 402 | x402 / MPP on Tempo |
| 4 | Buyer pre-authorizes the Agent on their Link wallet using **`create-payment-credential`** (one-time pre-auth, scoped to `amount`, `currency`, `expiry`, recipient) | Stripe Link CLI / SPT |
| 5 | Seller locks crypto in escrow on Tempo | Tempo escrow contract |
| 6 | Agent receives an **HTTP 402** challenge from Stripe Link to settle the fiat leg; replies with the **Shared Payment Token (SPT)** issued in step 4 | Stripe Link (HTTP 402 / SPT) |
| 7 | Stripe Link debits Buyer's wallet, credits Seller's Link account, fires `payout.paid` webhook | Stripe |
| 8 | TEE verifies the webhook signature, posts `validationResponse` to ERC-8004 | TEE + ERC-8004 |
| 9 | Escrow reads `getValidationStatus()` and **releases crypto to Buyer** | Tempo escrow contract |
| 10 | Both parties call `giveFeedback()` | ERC-8004 Reputation Registry |

> **Convergence note.** Both rails (x402 service-fee on Tempo and Stripe Link SPT)
> are now **HTTP 402** challenges. The Agent's HTTP client (`@x402/axios`) handles
> both with the same retry-on-402 pattern — the only difference is the resource
> server and the payment scheme.

---

## 3. Why Belvo / PSE is gone

| Old (Belvo / PSE polling) | New (Stripe webhook) |
|---|---|
| Poll Belvo bank API every N seconds for matching transfer | Stripe POSTs a webhook the moment funds settle |
| Heuristic match on `amount`, `concept`, `payer` (fragile) | Cryptographic match on `payout.id` + signed payload |
| Verification = "we *think* the transfer happened" | Verification = "Stripe **signed** that the transfer happened" |
| TEE work: parse JSON + fuzzy match (slow, error-prone) | TEE work: HMAC-SHA256 verify (~1ms, deterministic) |
| Failure modes: polling drift, ambiguous matches, false positives | Failure modes: signature mismatch only (clear, debuggable) |
| Country-locked to Colombia (PSE) | Global — Stripe Link recipients in any supported country, including `CO` |

**Bottom line.** The Stripe webhook is **self-proving**. The TEE no longer
*decides* whether settlement happened — it *witnesses* a cryptographic statement
that Stripe already made. The trust root collapses from "Belvo + heuristics +
TEE" to just "Stripe signing key + TEE".

---

## 4. Stack

| Layer | Tech | Role | Why this and not the alternative |
|---|---|---|---|
| Fiat rail (push) | **Stripe Global Payouts → Link** | Agent pushes USD to any user's Link account; recipient withdraws to local bank in COP | Replaces Belvo/PSE: signed webhook vs. polling heuristic; global vs. CO-only |
| Fiat rail (pull) | **Stripe Link `create-payment-credential` / SPT** | User pre-authorizes Agent to spend from their Link wallet; HTTP 402 + SPT settles | Replaces "Buyer sends a manual transfer + uploads screenshot"; fully autonomous |
| Crypto rail | **Tempo (TIP-20 stablecoins, e.g. USDC)** | Sub-second finality, sub-cent fees, native MPP / x402 support | Faster + cheaper than L2 rollups for stablecoin settlement; native agent payments |
| Escrow | **Solidity contract on Tempo** | Locks crypto until ERC-8004 Validation Registry says `ATTESTED` | On-chain, auditable, no custodial risk; reads validation directly on-chain |
| Service monetization | **x402 / HTTP 402 + `@x402/axios`** | Agent charges 0.1 USDC per settlement; discoverable in x402 / Bazaar | Stripe Link SPT also uses 402 — single client handles both flows |
| Identity & trust | **ERC-8004 Identity + Reputation + Validation registries** | Agent has on-chain `agentId` (ERC-721), a public registration file, an accumulating reputation score, and posts validation attestations | Buyer/Seller can find and trust the Agent without a centralized directory |
| TEE | **Trusted Execution Environment (e.g. AWS Nitro / Phala)** | Cryptographically verifies Stripe webhook, posts `validationResponse` on-chain | Deterministic 1-line job (HMAC verify) — no heuristics, no race conditions |
| Wallet & auth | **Privy** | Embedded wallets for non-crypto users; email / social / wallet-connect; server-side spending policies | Removes the "users need MetaMask" wall; policies cap agent spending per user |
| Off-chain state | **Supabase (Postgres + Realtime + RLS)** | Order book, trade state machine, user profiles, KYC status, Stripe account IDs | Realtime order book out of the box; RLS makes per-user state isolation trivial |
| Frontend | **Next.js (App Router)** | Privy auth, Stripe Connect onboarding (`stripe.initLinkConnection()`), order book, trade tracker | App Router + RSC → server components can call Supabase / Privy directly |
| Agent runtime | **Node/TypeScript** + Claude Agent SDK | Orchestrates MCP servers, runs the trade state machine, signs Tempo txns | Native MCP support; same TS toolchain as frontend; easy to colocate |

---

## 5. Workspace structure (what to scaffold)

```
convexo_p2p/
├── CLAUDE.md                         # Generated last; mirrors §10 rules below
├── README.md                         # Short — points at this doc
├── .claude/
│   ├── settings.json                 # Permissions, hooks, env passthrough
│   └── commands/                     # /trade-flow-a, /trade-flow-b, /deploy-escrow
├── .agents/
│   └── architect.md                  # Persona for protocol-level questions
├── mcp.json                          # Wiring for all MCP servers (see §6)
├── .env.example                      # All env vars (see §7)
├── docs/
│   ├── agenticp2p.md                 # THIS FILE
│   ├── flows/                        # Sequence diagrams (mermaid) for A and B
│   ├── 8004/                         # ERC-8004 registration files, agent card
│   ├── tempo/                        # Tempo wallet + MPP notes
│   ├── privy/                        # Privy setup notes
│   ├── supabase/                     # Schema + RLS policies
│   └── x402/                         # x402 / SPT examples
│
├── contracts/                        # Foundry workspace
│   ├── foundry.toml
│   ├── src/
│   │   ├── Escrow.sol                # lock / release / refund; reads ERC-8004
│   │   ├── interfaces/
│   │   │   ├── IIdentityRegistry.sol
│   │   │   ├── IReputationRegistry.sol
│   │   │   └── IValidationRegistry.sol
│   │   └── libs/TradeHash.sol
│   ├── script/
│   │   ├── DeployEscrow.s.sol
│   │   └── RegisterAgent.s.sol       # Mints agentId, publishes registration file
│   └── test/
│       ├── Escrow.t.sol
│       └── EscrowFork.t.sol          # Fork test against Tempo testnet
│
├── agent/                            # The Agent runtime (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  # Boots agent, connects MCP servers
│   │   ├── stateMachine.ts           # created → fee_paid → locked → fiat_sent → attested → released
│   │   ├── flows/
│   │   │   ├── cryptoToFiat.ts       # Flow A
│   │   │   └── fiatToCrypto.ts       # Flow B
│   │   ├── webhooks/
│   │   │   └── stripe.ts             # Signed webhook receiver → forwards to TEE
│   │   ├── tee/
│   │   │   ├── verifyStripeSig.ts    # HMAC-SHA256 verify
│   │   │   └── postValidation.ts     # Calls validationResponse on ERC-8004
│   │   ├── x402/
│   │   │   └── chargeServiceFee.ts   # @x402/axios — 0.1 USDC per trade
│   │   └── lib/
│   │       ├── supabase.ts
│   │       ├── tempo.ts
│   │       └── privy.ts
│   └── test/
│       ├── flowA.spec.ts
│       └── flowB.spec.ts
│
├── frontend/                         # Next.js (App Router)
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx                # PrivyProvider
│   │   ├── page.tsx                  # Landing
│   │   ├── orderbook/page.tsx        # Realtime order book (Supabase subscription)
│   │   ├── onboard/stripe/page.tsx   # stripe.initLinkConnection() widget
│   │   ├── trade/[id]/page.tsx       # Trade tracker (state machine viewer)
│   │   └── api/
│   │       ├── orders/route.ts
│   │       └── trades/[id]/route.ts
│   ├── lib/
│   │   ├── privy.ts
│   │   ├── stripe.ts
│   │   └── supabase.ts
│   └── components/
│       ├── OrderBook.tsx
│       ├── StripeLinkOnboard.tsx
│       └── TradeStatus.tsx
│
├── mcp-servers/                      # Build these — see §6.b
│   ├── stripe-payouts/
│   │   ├── package.json
│   │   ├── src/server.ts             # create_recipient, send_payout, get_payout_status
│   │   └── README.md
│   ├── erc8004/
│   │   ├── package.json
│   │   └── src/server.ts             # register, giveFeedback, validationRequest, validationResponse, getSummary
│   ├── x402-mpp/
│   │   ├── package.json
│   │   └── src/server.ts             # open_session, charge_intent, verify_payment, close_session
│   └── tempo-escrow/
│       ├── package.json
│       └── src/server.ts             # lock, status, release, refund
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_orders.sql
│   │   ├── 0002_trades.sql           # State machine columns + check constraints
│   │   ├── 0003_profiles.sql         # KYC, stripe_account_id, privy_did
│   │   └── 0004_rls.sql              # Row-level security
│   └── seed.sql
│
└── scripts/
    ├── boot-tee.sh                   # Spin up the TEE (Phala / Nitro)
    ├── register-agent.sh             # foundry script wrapper
    └── e2e-flow-a.ts                 # End-to-end smoke test
```

---

## 6. MCP wiring

### 6.a Already-available MCP servers (wire up, don't build)

| Server | URL / Command | Purpose |
|---|---|---|
| Stripe MCP | `mcp.stripe.com` (already connected) | Generic Stripe calls — used by `stripe-payouts` MCP and the agent directly |
| Privy docs | `https://docs.privy.io/mcp` | Doc lookup for embedded wallets / policies |
| Supabase | `https://mcp.supabase.com` | DB ops, migrations, RLS, edge functions |
| Tempo docs | `https://docs.tempo.xyz/api/mcp` | Tempo API + MPP reference |
| context7 | (already enabled) | Pull live docs for any lib (viem, Privy SDK, etc.) |

`mcp.json` (root) wires these plus the four custom servers below. Custom
servers run as local stdio MCP processes spawned from `mcp-servers/*`.

### 6.b MCP servers to build

#### `mcp-servers/stripe-payouts`
Wraps Stripe Global Payouts → Link.

```ts
create_recipient({ email, country, name }) -> { recipientId, connectionSessionUrl }
send_payout({ recipientId, amountUsd, tradeId, idempotencyKey }) -> { payoutId, status }
get_payout_status({ payoutId }) -> { status, settledAt?, failureCode? }
verify_webhook({ rawBody, signature }) -> { verified: bool, event }
```

#### `mcp-servers/erc8004`
Thin viem wrapper over the three ERC-8004 registries.

```ts
register({ registrationFileUri, walletAddress }) -> { agentId, txHash }
giveFeedback({ counterpartyAgentId, score, uri }) -> { txHash }
validationRequest({ tradeHash, validatorAgentId }) -> { txHash }
validationResponse({ tradeHash, status, evidenceUri }) -> { txHash }   // called from TEE
getSummary({ agentId }) -> { reputationScore, totalTrades, lastUpdated }
getValidationStatus({ tradeHash }) -> "PENDING" | "ATTESTED" | "REJECTED"
```

#### `mcp-servers/x402-mpp`
MPP / x402 service-fee handling.

```ts
open_session({ buyerAgentId, asset: "USDC", chain: "tempo" }) -> { sessionId, paymentEndpoint }
charge_intent({ sessionId, amountUsdc, tradeId }) -> { httpChallenge }   // emits HTTP 402
verify_payment({ sessionId, txHash }) -> { ok: bool, settledAmount }
close_session({ sessionId }) -> { totalCharged }
```

#### `mcp-servers/tempo-escrow`
Wraps the on-chain `Escrow.sol`.

```ts
lock({ tradeId, sellerAddress, buyerAddress, amount, asset, validationHash }) -> { txHash }
status({ tradeId }) -> { state: "Empty"|"Locked"|"Released"|"Refunded", lockedAt?, releasedAt? }
release({ tradeId }) -> { txHash }    // reverts unless ERC-8004 says ATTESTED
refund({ tradeId, reason }) -> { txHash }   // only after timeout or REJECTED
```

---

## 7. Environment variables (`.env.example`)

```bash
# --- Stripe ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_LINK_CLI_TOKEN=...                    # for create-payment-credential

# --- Tempo ---
TEMPO_RPC_URL=https://rpc.tempo.xyz
TEMPO_CHAIN_ID=...
TEMPO_AGENT_PRIVATE_KEY=0x...                # Agent's wallet (use Privy server policy in prod)
TEMPO_USDC_ADDRESS=0x...
ESCROW_CONTRACT_ADDRESS=0x...

# --- ERC-8004 ---
ERC8004_IDENTITY_REGISTRY=0x...
ERC8004_REPUTATION_REGISTRY=0x...
ERC8004_VALIDATION_REGISTRY=0x...
AGENT_ID=...                                  # ERC-721 tokenId after registration
AGENT_REGISTRATION_URI=ipfs://...

# --- TEE ---
TEE_ATTESTOR_URL=https://...
TEE_PRIVATE_KEY=0x...                         # Key that signs validationResponse
TEE_ATTESTATION_DOC_URL=...

# --- Privy ---
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
PRIVY_VERIFICATION_KEY=...

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# --- x402 / MPP ---
X402_FACILITATOR_URL=...
AGENT_SERVICE_FEE_USDC=0.1
AGENT_X402_RECEIVE_ADDRESS=0x...

# --- Agent runtime ---
AGENT_WEBHOOK_PUBLIC_URL=https://...          # Where Stripe POSTs payout.paid
AGENT_LOG_LEVEL=info
```

---

## 8. Skill triggers

The workspace ships with `.claude/settings.json` configured so these conditions
auto-activate skills already installed in this environment.

| Condition / signal | Skill to activate | Why |
|---|---|---|
| User mentions "stripe", "payout", "Link account", "webhook signature" | `payment-processing:stripe-integration`, `stripe:stripe-best-practices` | Authoritative Stripe patterns |
| Stripe error code surfaces in logs / output | `stripe:explain-error` | Decode error → fix |
| Editing `contracts/src/*.sol` or "deploy escrow" | `ethskills:security`, `ethskills:testing`, `viem-integration` | Solidity security + Foundry tests + viem reads |
| User says "deploy", "verify contract", "register agent" | `ethskills:frontend-playbook`, `deployer` | Production deploy checklist |
| User mentions "tempo", "MPP", "x402", "HTTP 402", "pay for API" | `tempo-request`, `uniswap-trading:pay-with-any-token` | Tempo CLI + 402 challenge handling |
| Editing Supabase migrations, RLS, or `supabase/*.sql` | `supabase:supabase`, `supabase:supabase-postgres-best-practices` | Schema + RLS correctness |
| Editing `frontend/app/**/*.tsx` | `vercel:nextjs`, `vercel:react-best-practices`, `frontend-design:frontend-design` | Next.js App Router + React patterns |
| Editing/creating `CLAUDE.md` | `claude-md-management:claude-md-improver` | Keep CLAUDE.md healthy |
| Pre-merge / pre-deploy review | `ethskills:audit`, `code-review:code-review`, `security-review` | Smart-contract + general code audit |
| User asks "what skills exist?" or "extend capabilities" | `find-skills` | Discovery |
| Building a new MCP server | `agent-sdk-dev:new-sdk-app` | SDK scaffolding |

---

## 9. Trade state machine (Supabase)

```
created
  └─> fee_paid          (Buyer paid 0.1 USDC via x402)
        └─> locked      (Seller locked crypto in escrow)
              └─> fiat_sent      (Agent triggered Stripe payout / SPT settle)
                    └─> attested (TEE posted validationResponse=ATTESTED)
                          └─> released   (Escrow released crypto to Buyer)
                                └─> complete (Both sides gave feedback)

Failure forks:
  any → expired   (timeout — escrow refunds Seller, fee non-refundable after fee_paid)
  any → disputed  (manual review; not in v1 scope but reserve column)
```

Encode as a Postgres `enum` plus check constraints; expose via Realtime to the
frontend so `/trade/[id]` updates live.

---

## 10. Rules for Claude Code in this workspace

1. **Read first, then ask, then build.** Never start scaffolding without
   confirming intent. If the user says "build it", confirm scope (which
   sub-tree: `contracts/`, `agent/`, `frontend/`, `mcp-servers/*`).
2. **Never invent contract addresses, RPC URLs, Stripe IDs, or chain IDs.**
   Pull them from `.env`, `mcp.json`, or ask.
3. **No screenshots, no manual fiat verification.** All fiat verification goes
   through the signed Stripe webhook → TEE → ERC-8004 path. If a flow seems to
   need a screenshot, the design is wrong — stop and surface it.
4. **Idempotency is mandatory** on every Stripe call (`Idempotency-Key: <tradeId>`),
   every Tempo `lock`/`release` (use `tradeId`), and every ERC-8004 write.
5. **Webhook signature verification runs in the TEE only.** The agent process
   forwards the raw body + signature header; it does **not** trust its own
   verification. Local-dev mode may verify in-process behind a flag.
6. **All on-chain writes are reviewed.** Any change to `contracts/src/*.sol` or
   to a script that writes on-chain triggers `ethskills:security` +
   `ethskills:testing` before merge.
7. **RLS on by default.** Every Supabase table has RLS enabled. No table is
   readable with anon key beyond the order book's public columns.
8. **Don't mix flows.** Flow A and Flow B share infrastructure but are separate
   files, separate state-machine paths, separate test suites. No shared "mega
   handler".
9. **Privy server policies cap agent spending.** The Agent's Tempo wallet is a
   Privy server wallet with a per-trade and per-day cap.
10. **No emojis in code or commit messages** unless the user explicitly asks.
11. **Prefer editing over creating files.** Especially for CLAUDE.md, README,
    and `.env.example`. Update; don't fork.
12. **When in doubt about a library API**, call `context7` before writing code.

---

## 11. After you finish — checklist

- [ ] `mcp.json` wires all 5 external MCP servers + 4 custom servers; `claude mcp list` shows them all green
- [ ] `.env.example` has every variable from §7; no real secrets committed
- [ ] `contracts/`: `forge build` clean, `forge test` ≥ 90% coverage on `Escrow.sol`
- [ ] `Escrow.sol` reads `IValidationRegistry.getValidationStatus(tradeHash)` before `release` — verified by a fork test
- [ ] `agent/` boots, connects to all MCP servers, runs `e2e-flow-a.ts` against testnet end-to-end
- [ ] Stripe webhook endpoint is reachable from the public internet (ngrok or deployed); `stripe listen` test event succeeds
- [ ] TEE attestor is running; `TEE_PRIVATE_KEY` is registered as a validator on the ERC-8004 Validation Registry
- [ ] Agent has been registered: `AGENT_ID` is set, registration file is published at `AGENT_REGISTRATION_URI`
- [ ] Supabase migrations applied; RLS verified with `supabase test db`
- [ ] `frontend/` builds (`next build` clean), Privy login works, Stripe Link onboarding widget mounts, order book updates in realtime
- [ ] `/trade/[id]` UI updates live as the state machine advances on testnet
- [ ] Both flows have a passing end-to-end test recorded in `scripts/` and a mermaid diagram in `docs/flows/`
- [ ] CLAUDE.md exists at the root and mirrors §10
- [ ] `code-review` + `security-review` + `ethskills:audit` runs are clean

---

## 12. Important — start posture

**Do not start scaffolding on read.** This file is a plan. Before you generate
any code:

1. Confirm with the user **which sub-tree** to scaffold first. Suggested order:
   `supabase/` → `contracts/` → `mcp-servers/erc8004` → `mcp-servers/tempo-escrow`
   → `mcp-servers/stripe-payouts` → `mcp-servers/x402-mpp` → `agent/` → `frontend/`.
2. Confirm which network: **Tempo testnet** for v1.
3. Confirm Stripe mode: **test mode** for v1 (`sk_test_...`, test webhooks).
4. Verify the user has accounts/keys for: Stripe, Privy, Supabase, Tempo,
   IPFS / Pinata (for the agent registration file), and a TEE host (Phala /
   AWS Nitro).
5. Only then begin — and do **one sub-tree at a time**, with a clear stopping
   point and a working test before moving on.

When you are ready, propose the first sub-tree and the first three commits, then
wait for approval.
