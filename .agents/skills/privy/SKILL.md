---
name: Privy
description: Use when building authentication systems, creating and managing embedded wallets, signing blockchain transactions, implementing wallet controls and policies, managing users, or integrating wallet infrastructure into web, mobile, or backend applications. Agents should reach for this skill when implementing user onboarding flows, wallet creation, transaction signing, policy enforcement, or API-driven wallet operations.
metadata:
    mintlify-proj: privy
    version: "1.0"
---

# Privy Skill Reference

## Product summary

Privy is an authentication and wallet infrastructure platform that enables developers to onboard users with embedded wallets, manage blockchain transactions, and enforce granular controls over wallet behavior. It provides client-side SDKs (React, React Native, Swift, Android, Flutter, Unity) for user-facing applications and server-side SDKs (Node.js, Python, Java, Go, Rust) for backend wallet management. The core platform uses secure execution environments (TEEs) and key splitting to ensure only authorized parties can access wallet keys. Access the primary documentation at https://docs.privy.io.

**Key files and configuration:**
- Privy Dashboard: https://dashboard.privy.io (create apps, manage configurations, view wallets and users)
- App ID and App Secret: Required for all API calls and SDK initialization
- PrivyProvider (React): Wraps your app to enable authentication and wallet access
- PrivyClient (Node.js): Server-side entry point for wallet and user management
- REST API endpoint: https://api.privy.io/v1

**Core SDKs:**
- Client: `@privy-io/react-auth`, `@privy-io/expo` (React Native), `@privy-io/swift-sdk`, `@privy-io/android-sdk`
- Server: `@privy-io/node`, `@privy-io/python-sdk`, `@privy-io/java-sdk`, `@privy-io/go-sdk`, `@privy-io/rust-sdk`

## When to use

Reach for this skill when:
- **Building authentication flows**: Implementing email, SMS, social login, passkey, or wallet-based authentication
- **Creating embedded wallets**: Provisioning self-custodial wallets for users or server-controlled wallets for applications
- **Signing transactions**: Executing blockchain transactions on Ethereum, Solana, or 50+ other chains
- **Enforcing wallet controls**: Setting up owners, signers, policies, and authorization keys to control wallet behavior
- **Managing users**: Creating users, linking accounts, querying user data, or migrating users from other systems
- **Building wallet actions**: Implementing transfers, swaps, or earn operations
- **Handling webhooks**: Reacting to user, wallet, transaction, or intent events in real time
- **Configuring dashboard settings**: Setting up login methods, appearance, SSO, MFA, or app clients

Do NOT use this skill for: Installation/setup instructions, pricing/billing, account creation, authentication configuration beyond basic setup, or dashboard-only operations.

## Quick reference

### Essential commands and patterns

| Task | Client SDK | Server SDK | REST API |
|------|-----------|-----------|----------|
| Initialize | `<PrivyProvider appId="..." />` | `new PrivyClient({appId, appSecret})` | Basic auth header with app ID:secret |
| Create wallet | `useCreateWallet().createWallet()` | `privy.wallets().create({chain_type})` | `POST /v1/wallets` |
| Get wallet | `useWallets()` hook | `privy.wallets().get(walletId)` | `GET /v1/wallets/{id}` |
| Sign transaction | `useSignTransaction()` | `privy.wallets().ethereum().signTransaction()` | `POST /v1/wallets/{id}/ethereum/sign-transaction` |
| Create user | N/A | `privy.users().create({...})` | `POST /v1/users` |
| Get user | `usePrivy().user` | `privy.users().get(userId)` | `GET /v1/users/{id}` |
| Create policy | Dashboard or SDK | `privy.policies().create({...})` | `POST /v1/policies` |
| Create authorization key | Dashboard | `generateP256KeyPair()` | N/A |

### Configuration options

**PrivyProvider config (React):**
```tsx
config={{
  embeddedWallets: {
    ethereum: { createOnLogin: 'users-without-wallets' },
    solana: { createOnLogin: 'users-without-wallets' }
  },
  loginMethods: ['email', 'wallet', 'google'],
  appearance: { theme: 'light' }
}}
```

**Wallet ownership models:**
- User-owned: User has full control, keys only accessible to user
- User-owned with server access: User retains ownership, server has scoped permissions via signers
- Application-owned: Application controls via authorization keys
- Custodial: Third-party custodian operates wallet on behalf of beneficiary

**Chain support tiers:**
- Tier 1 (full support): Ethereum, Solana, Base, Polygon, Arbitrum, Optimism
- Tier 2 (extended support): Cosmos, Stellar, Sui, Aptos, TON, Starknet, Bitcoin, Tron, Near, Movement
- Tier 3 (limited support): Other EVM/SVM compatible chains

### Common file paths and conventions

- App credentials: Store `PRIVY_APP_ID` and `PRIVY_APP_SECRET` in environment variables
- Wallet IDs: Unique identifiers returned from wallet creation (e.g., `fmfdj6yqly31huorjqzq38zc`)
- User IDs: Privy user identifiers in format `did:privy:xxxxx`
- Authorization keys: P-256 keypairs generated via `generateP256KeyPair()` or Dashboard
- Policy IDs: Unique identifiers for policies (e.g., `qvah5m2hmp9abqlxdmfiht95`)
- External IDs: Optional custom identifiers for wallets (URL-safe, max 64 chars, write-once)

## Decision guidance

### When to use embedded wallets vs external wallets

| Scenario | Embedded | External |
|----------|----------|----------|
| New users without crypto experience | ✓ | ✗ |
| Users bringing existing wallets | ✗ | ✓ |
| Need full control over key management | ✓ | ✗ |
| Users want to use MetaMask/Phantom | ✗ | ✓ |
| Building consumer app | ✓ | ✗ |
| Power users, crypto-native | ✗ | ✓ |
| Need server-side automation | ✓ | ✗ |

### When to use Privy authentication vs JWT-based auth

| Scenario | Privy Auth | JWT-based |
|----------|-----------|-----------|
| No existing auth system | ✓ | ✗ |
| Need multiple login methods | ✓ | ✗ |
| Already have Auth0/Firebase | ✗ | ✓ |
| Want Privy to manage users | ✓ | ✗ |
| Integrating with existing system | ✗ | ✓ |
| Need email + social + wallet login | ✓ | ✗ |

### When to use policies vs signers

| Scenario | Policies | Signers |
|----------|----------|---------|
| Enforce transaction limits | ✓ | ✗ |
| Restrict recipient addresses | ✓ | ✗ |
| Grant scoped permissions to server | ✗ | ✓ |
| Require multi-sig approval | ✗ | ✓ |
| Control smart contract interactions | ✓ | ✗ |
| Delegate trading authority | ✗ | ✓ |
| Time-bound restrictions | ✓ | ✗ |

## Workflow

### Typical task: Create a user with an embedded wallet and sign a transaction

1. **Initialize Privy** in your app (client or server)
   - Client: Wrap app with `<PrivyProvider appId="..." />`
   - Server: `new PrivyClient({appId, appSecret})`

2. **Authenticate the user**
   - Client: Use `usePrivy().login()` or built-in login modal
   - Server: Create user via `privy.users().create({...})`

3. **Create a wallet** for the user
   - Client: Call `useCreateWallet().createWallet({})` after login
   - Server: Call `privy.wallets().create({chain_type: 'ethereum', owner: {user_id}})`
   - Configure: Set `createOnLogin: 'users-without-wallets'` to auto-create on login

4. **Retrieve the wallet** to get address and ID
   - Client: Access via `useWallets()` hook
   - Server: Call `privy.wallets().get(walletId)` or `privy.wallets().getAll(userId)`

5. **Create a policy** (optional, for transaction controls)
   - Define rules for allowed transactions (amounts, recipients, methods)
   - Attach policy ID to wallet at creation or via update

6. **Sign a transaction**
   - Client: Use `useSignTransaction()` or chain-specific hooks
   - Server: Call `privy.wallets().ethereum().signTransaction({...})`
   - Include authorization context if using authorization keys

7. **Handle the response**
   - Check for errors (policy violations, insufficient funds, expired keys)
   - Broadcast signed transaction to blockchain or return to client
   - Listen for webhooks to track transaction status

8. **Verify completion**
   - Check transaction status via block explorer or `privy.wallets().getTransactions()`
   - Listen for `transaction.confirmed` or `transaction.failed` webhooks
   - Update UI with transaction result

### Typical task: Set up wallet controls with owners and signers

1. **Understand ownership model**
   - Decide: user-owned, user-owned with server access, or application-owned
   - Determine: who approves transactions, what limits apply

2. **Create authorization keys** (for server or multi-sig)
   - Dashboard: Go to Wallets > Authorization keys > New key
   - SDK: `const {privateKey, publicKey} = await generateP256KeyPair()`
   - Store private key securely (Privy cannot recover it)

3. **Create a key quorum** (for multi-sig or delegation)
   - Combine multiple authorization keys or user IDs
   - Set threshold (e.g., 2-of-3 signatures required)

4. **Create a policy** with rules
   - Define conditions: transaction amounts, recipients, methods, time windows
   - Set action: ALLOW or DENY
   - Attach to wallet at creation

5. **Create the wallet** with owner and policy
   - Specify owner (user ID, authorization key, or key quorum)
   - Attach policy IDs
   - Add additional signers if needed

6. **Test the controls**
   - Attempt transactions that should be allowed
   - Attempt transactions that should be denied
   - Verify policy violations are caught

7. **Monitor and update**
   - Review policy logs in Dashboard
   - Update policies as requirements change
   - Rotate authorization keys periodically

## Common gotchas

- **Forgetting to wait for Privy to be ready**: Always check `usePrivy().ready` before consuming Privy state. Stale state can cause unexpected behavior.
- **Not setting up authorization context**: Server-side signing requires proper authorization signatures. Use `AuthorizationContext` in SDKs to auto-sign requests.
- **Policy defaults to DENY**: If a wallet has a policy, any RPC method not explicitly allowed in a rule will be denied. Include an "allow all" rule for forward compatibility.
- **User signing keys expire**: User session keys are time-bound. Request fresh keys before making API calls; SDKs handle this automatically with `AuthorizationContext`.
- **Incorrect policy conditions**: Numerical values are evaluated as-is (wei for ETH, lamports for SOL). Ensure amounts match the precision expected.
- **Missing idempotency keys**: For critical operations (wallet creation, user creation), include idempotency keys to prevent duplicate requests.
- **Rate limiting on wallet creation**: Wallet creation endpoints are rate-limited. Implement exponential backoff for retries.
- **Webhook signature verification**: Always verify webhook payload signatures using the signing key from the Dashboard. Never trust unsigned webhooks.
- **Automatic wallet creation limitations**: Auto-creation only works with the Privy login modal, not with direct login methods like `loginWithCode` or custom OAuth flows.
- **External wallet chain configuration**: External wallets require explicit chain configuration in the Dashboard. Unconfigured chains will not appear in the wallet selector.
- **Policy evaluation in secure enclaves**: Policies are evaluated inside secure enclaves; you cannot inspect policy evaluation logs directly. Use Dashboard or API to review policy configuration.
- **Custodial wallet approval flow**: Custodial wallets require explicit approval from the custodian. Transactions are not automatically signed.

## Verification checklist

Before submitting work with Privy:

- [ ] App ID and App Secret are correctly configured and stored in environment variables
- [ ] PrivyProvider wraps the app at the root level (React) or PrivyClient is instantiated once (server)
- [ ] `usePrivy().ready` is checked before consuming Privy state (client-side)
- [ ] Wallet creation is configured (auto-create on login or manual creation)
- [ ] Authorization context is set up for server-side signing (if using authorization keys)
- [ ] Policies are created and attached to wallets (if enforcing transaction controls)
- [ ] Webhook endpoint is registered and signature verification is implemented
- [ ] Error handling covers policy violations, insufficient funds, and expired keys
- [ ] Rate limiting and retry logic are implemented for API calls
- [ ] Idempotency keys are used for critical operations
- [ ] User authentication flow is tested (login, logout, account linking)
- [ ] Wallet operations are tested (creation, signing, balance checks)
- [ ] Transaction signing is tested on testnet before production
- [ ] Webhook events are being received and processed correctly
- [ ] Dashboard configuration matches SDK configuration (login methods, chains, appearance)

## Resources

**Comprehensive navigation**: https://docs.privy.io/llms.txt provides a complete page-by-page listing of all documentation.

**Critical documentation pages**:
1. [Key Concepts](https://docs.privy.io/basics/key-concepts) — Understand authentication, wallets, and controls
2. [API Reference Introduction](https://docs.privy.io/api-reference/introduction) — Overview of REST API, rate limits, and authentication
3. [Controls and Policies Overview](https://docs.privy.io/controls/overview) — Learn how to set up wallet controls and policy enforcement

---

> For additional documentation and navigation, see: https://docs.privy.io/llms.txt