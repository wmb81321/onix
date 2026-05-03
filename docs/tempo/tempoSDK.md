<!--
Sitemap:
- [Tempo](/index): Explore Tempo's blockchain documentation, integration guides, and protocol specs. Build low-cost, high-throughput payment applications.
- [Accounts SDK – Getting Started](/accounts/): Set up the Tempo Accounts SDK to create, manage, and interact with accounts on Tempo.
- [Changelog](/changelog)
- [Tempo CLI](/cli/): A single binary for using Tempo Wallet from the terminal, making paid HTTP requests, and running a Tempo node.
- [Tempo Ecosystem Infrastructure](/ecosystem/): Explore Tempo's ecosystem partners providing bridges, wallets, node infrastructure, data analytics, security, and more for building on Tempo.
- [Learn](/learn/): Explore stablecoin use cases and Tempo's payments-optimized blockchain architecture for remittances, payouts, and embedded finance.
- [Tempo Protocol](/protocol/): Technical specifications and reference documentation for the Tempo blockchain protocol, purpose-built for global payments at scale.
- [SDKs](/sdk/): Integrate Tempo into your applications with SDKs for TypeScript, Go, Rust, and Foundry. Build blockchain apps in your preferred language.
- [Tempo CLI](/wallet/): A terminal client for Tempo wallet management, service discovery, and paid HTTP requests via the Machine Payments Protocol.
- [FAQ](/accounts/faq): Frequently asked questions about the Tempo Accounts SDK.
- [Deploying to Production](/accounts/production): Things to consider before deploying your application with the Tempo Accounts SDK to production.
- [Handlers](/accounts/server/): Server-side handlers for the Tempo Accounts SDK.
- [tempo download](/cli/download): Download chain snapshots for faster initial sync of a Tempo node.
- [tempo node](/cli/node): Command reference for running a Tempo node.
- [tempo request](/cli/request): A curl-like HTTP client that handles MPP payment negotiation automatically.
- [tempo wallet](/cli/wallet): Use Tempo Wallet from the terminal — authenticate, check balances, manage access keys, and discover services.
- [Block Explorers](/ecosystem/block-explorers): View transactions, blocks, accounts, and token activity on the Tempo network with block explorers.
- [Bridges & Exchanges](/ecosystem/bridges): Move assets to and from Tempo with cross-chain bridges and access deep DEX liquidity with exchange infrastructure.
- [Data & Analytics](/ecosystem/data-analytics): Query blockchain data on Tempo with indexers, analytics platforms, oracles, and monitoring tools.
- [Node Infrastructure](/ecosystem/node-infrastructure): Connect to Tempo with reliable RPC endpoints and managed node services from infrastructure partners.
- [Issuance & Orchestration](/ecosystem/orchestration): Move money globally between local currencies and stablecoins. Issue, transfer, and manage stablecoins on Tempo.
- [Security & Compliance](/ecosystem/security-compliance): Transaction scanning, threat detection, and compliance infrastructure for Tempo applications.
- [Smart Contract Libraries](/ecosystem/smart-contract-libraries): Build with account abstraction and programmable smart contract wallets on Tempo.
- [Wallets](/ecosystem/wallets): Integrate embedded, custodial, and institutional wallet infrastructure into your Tempo application.
- [!Replace Me!](/guide/_template)
- [Bridge via LayerZero](/guide/bridge-layerzero): Bridge tokens to and from Tempo using LayerZero. Covers Stargate pools and standard OFT adapters with cast commands and TypeScript examples.
- [Bridge via Relay](/guide/bridge-relay): Bridge tokens to and from Tempo using Relay. Includes supported token discovery, curl commands, TypeScript examples with viem, and status tracking.
- [Getting Funds on Tempo](/guide/getting-funds): Bridge assets to Tempo, add funds in Tempo Wallet, or use the faucet on testnet.
- [Stablecoin Issuance](/guide/issuance/): Create and manage your own stablecoin on Tempo. Issue tokens, manage supply, and integrate with Tempo's payment infrastructure.
- [Agentic Payments](/guide/machine-payments/): Make agentic payments using the Machine Payments Protocol (MPP) on Tempo — charge for APIs, MCP tools, and digital content with TIP-20 stablecoins.
- [Tempo Node](/guide/node/): Run your own Tempo node for direct network access. Set up RPC nodes for API access or validator nodes to participate in consensus.
- [Stablecoin Payments](/guide/payments/): Send and receive stablecoin payments on Tempo. Integrate payments with flexible fee options, sponsorship capabilities, and parallel transactions.
- [Connect to Tempo Zones](/guide/private-zones/): Learn how Tempo Zones work alongside the public chain and follow guides for depositing, sending within a zone, routing pathUSD across zones, swapping into betaUSD, and withdrawing.
- [Exchange Stablecoins](/guide/stablecoin-dex/): Trade between stablecoins on Tempo's enshrined DEX. Execute swaps, provide liquidity, and query the onchain orderbook for optimal pricing.
- [Use Tempo Transactions](/guide/tempo-transaction/): Learn how to use Tempo Transactions for configurable fee tokens, fee sponsorship, batch calls, access keys, and concurrent execution.
- [Create & Use Accounts](/guide/use-accounts/): Create and integrate Tempo accounts with the universal Tempo Wallet or domain-bound passkeys.
- [Using Tempo with AI](/guide/using-tempo-with-ai): Give your AI coding agent Tempo documentation context and a wallet for autonomous transactions.
- [Partners](/learn/partners): Discover Tempo's ecosystem of stablecoin issuers, wallets, custody providers, compliance tools, and ramps.
- [What are stablecoins?](/learn/stablecoins): Learn what stablecoins are, how they maintain value through reserves, and the payment use cases they enable for businesses globally.
- [Tempo](/learn/tempo/): Discover Tempo, the payments-first blockchain with instant settlement, predictably low fees, and native stablecoin support.
- [Exchanging Stablecoins](/protocol/exchange/): Tempo's enshrined decentralized exchange for trading between stablecoins with optimal pricing, limit orders, and flip orders for liquidity provision.
- [Transaction Fees](/protocol/fees/): Pay transaction fees in any USD stablecoin on Tempo. No native token required—fees are paid directly in TIP-20 stablecoins with automatic conversion.
- [Tempo RPC Reference](/protocol/rpc/): Reference for Tempo-specific JSON-RPC methods in the tempo, consensus, and admin namespaces, plus modified eth_ behavior.
- [Tempo Improvement Proposals (TIPs)](/protocol/tips/)
- [Tempo Transactions](/protocol/transactions/): Learn about Tempo Transactions, a new EIP-2718 transaction type with passkey support, fee sponsorship, batching, and concurrent execution.
- [Tempo Zones](/protocol/zones/): Tempo Zones are private execution environments on Tempo Mainnet where balances, transfers, and transaction history are invisible to the public chain.
- [Connect to the Network](/quickstart/connection-details): Connect to Tempo using browser wallets, CLI tools, or direct RPC endpoints. Get chain ID, URLs, and configuration details.
- [Developer Tools](/quickstart/developer-tools): Explore Tempo's developer ecosystem with indexers, embedded wallets, node infrastructure, and analytics partners for building payment apps.
- [EVM Differences](/quickstart/evm-compatibility): Learn how Tempo differs from Ethereum. Understand wallet behavior, fee token selection, VM layer changes, and fast finality consensus.
- [Faucet](/quickstart/faucet): Get free test stablecoins on Tempo Testnet. Connect your wallet or enter any address to receive pathUSD, AlphaUSD, BetaUSD, and ThetaUSD.
- [Integrate Tempo](/quickstart/integrate-tempo): Build on Tempo Testnet. Connect to the network, explore SDKs, and follow guides for accounts, payments, and stablecoin issuance.
- [Predeployed Contracts](/quickstart/predeployed-contracts): Discover Tempo's predeployed system contracts including TIP-20 Factory, Fee Manager, Stablecoin DEX, and standard utilities like Multicall3.
- [Tempo Token List Registry](/quickstart/tokenlist)
- [Contract Verification](/quickstart/verify-contracts): Verify your smart contracts on Tempo using contracts.tempo.xyz. Sourcify-compatible verification with Foundry integration.
- [Wallet Integration Guide](/quickstart/wallet-developers): Integrate Tempo into your wallet. Handle fee tokens, configure gas display, and deliver enhanced stablecoin payment experiences for users.
- [Foundry for Tempo](/sdk/foundry/): Build, test, and deploy smart contracts on Tempo using Foundry. Access Tempo protocol features with forge, cast, anvil, and chisel.
- [Go](/sdk/go/): Build blockchain apps with the Tempo Go SDK. Send transactions, batch calls, and handle fee sponsorship with idiomatic Go code.
- [Python](/sdk/python/): Build blockchain apps with the Tempo Python SDK. Send transactions, batch calls, and handle fee sponsorship using web3.py.
- [Rust](/sdk/rust/): Build blockchain apps with the Tempo Rust SDK using Alloy. Query chains, send transactions, and manage tokens with type-safe Rust code.
- [TypeScript SDKs](/sdk/typescript/): Build blockchain apps with Tempo using Viem and Wagmi. Send transactions, manage tokens, and integrate AMM pools with TypeScript.
- [Tempo Wallet CLI Recipes](/wallet/recipes): Use practical Tempo Wallet CLI recipes for service discovery, paid requests, session management, and funding or transfers.
- [Tempo CLI Reference](/wallet/reference): Complete command and flag reference for tempo wallet and tempo request.
- [Use Tempo Wallet CLI with Agents](/wallet/use-with-agents): Connect Tempo Wallet CLI to your agent and understand the built-in features that make agent-driven paid requests reliable and safe.
- [Adapters](/accounts/api/adapters): Pluggable adapters for the Tempo Accounts SDK Provider.
- [dialog](/accounts/api/dialog): Adapter for the Tempo Wallet dialog, an embedded iframe or popup for account management.
- [Dialog.iframe](/accounts/api/dialog.iframe): Embed the Tempo Wallet auth UI in an iframe dialog element.
- [Dialog.popup](/accounts/api/dialog.popup): Open the Tempo Wallet auth UI in a popup window.
- [Dialog](/accounts/api/dialogs): Dialog modes for embedding the Tempo Wallet.
- [Expiry](/accounts/api/expiry): Utility functions for computing access key expiry timestamps.
- [local](/accounts/api/local): Key-agnostic adapter for defining arbitrary account types and signing mechanisms.
- [Provider](/accounts/api/provider): Create an EIP-1193 provider for managing accounts on Tempo.
- [webAuthn](/accounts/api/webAuthn): Adapter for passkey-based accounts using WebAuthn registration and authentication.
- [WebAuthnCeremony](/accounts/api/webauthnceremony): Pluggable strategy for WebAuthn registration and authentication ceremonies.
- [WebAuthnCeremony.from](/accounts/api/webauthnceremony.from): Create a WebAuthnCeremony from a custom implementation.
- [WebAuthnCeremony.server](/accounts/api/webauthnceremony.server): Server-backed WebAuthn ceremony that delegates to a remote handler.
- [Create & Use Accounts](/accounts/guides/create-and-use-accounts): Choose between universal wallet experiences or domain-bound passkey accounts for your app.
- [eth_fillTransaction](/accounts/rpc/eth_fillTransaction): Fills missing transaction fields and returns wallet-aware metadata.
- [eth_sendTransaction](/accounts/rpc/eth_sendTransaction): Send a transaction from the connected account.
- [eth_sendTransactionSync](/accounts/rpc/eth_sendTransactionSync): Send a transaction and wait for the receipt.
- [personal_sign](/accounts/rpc/personal_sign): Sign a message with the connected account.
- [wallet_authorizeAccessKey](/accounts/rpc/wallet_authorizeAccessKey): Authorize an access key for delegated transaction signing.
- [wallet_connect](/accounts/rpc/wallet_connect): Connect account(s) with optional capabilities like access key authorization.
- [wallet_disconnect](/accounts/rpc/wallet_disconnect): Disconnect the connected account(s).
- [wallet_getBalances](/accounts/rpc/wallet_getBalances): Get token balances for an account.
- [wallet_getCallsStatus](/accounts/rpc/wallet_getCallsStatus): Get the status of a batch of calls sent via wallet_sendCalls.
- [wallet_getCapabilities](/accounts/rpc/wallet_getCapabilities): Get account capabilities for specified chains.
- [wallet_revokeAccessKey](/accounts/rpc/wallet_revokeAccessKey): Revoke a previously authorized access key.
- [wallet_sendCalls](/accounts/rpc/wallet_sendCalls): Send a batch of calls from the connected account.
- [Handler.compose](/accounts/server/handler.compose): Compose multiple server handlers into a single handler.
- [Handler.feePayer (Deprecated)](/accounts/server/handler.feePayer): Deprecated — use Handler.relay with feePayer option instead.
- [Handler.relay](/accounts/server/handler.relay): Server handler that proxies certain RPC requests with wallet-aware enrichment.
- [Handler.webAuthn](/accounts/server/handler.webAuthn): Server-side WebAuthn ceremony handler for registration and authentication.
- [Kv](/accounts/server/kv): Key-value store adapters for server-side persistence.
- [tempoWallet](/accounts/wagmi/tempoWallet): Wagmi connector for the Tempo Wallet dialog.
- [webAuthn](/accounts/wagmi/webAuthn): Wagmi connector for passkey-based WebAuthn accounts.
- [Create a Stablecoin](/guide/issuance/create-a-stablecoin): Create your own stablecoin on Tempo using the TIP-20 token standard. Deploy tokens with built-in compliance features and role-based permissions.
- [Distribute Rewards](/guide/issuance/distribute-rewards): Distribute rewards to token holders using TIP-20's built-in reward mechanism. Allocate tokens proportionally based on holder balances.
- [Manage Your Stablecoin](/guide/issuance/manage-stablecoin): Configure stablecoin permissions, supply limits, and compliance policies. Grant roles, set transfer policies, and control pause/unpause functionality.
- [Mint Stablecoins](/guide/issuance/mint-stablecoins): Mint new tokens to increase your stablecoin's total supply. Grant the issuer role and create tokens with optional memos for tracking.
- [Use Your Stablecoin for Fees](/guide/issuance/use-for-fees): Enable users to pay transaction fees using your stablecoin. Add fee pool liquidity and integrate with Tempo's flexible fee payment system.
- [Agent Quickstart](/guide/machine-payments/agent): Use the tempo CLI to discover services, preview costs, and make paid requests from a terminal or AI agent — no SDK required.
- [Client Quickstart](/guide/machine-payments/client): Set up an MPP client on Tempo. Polyfill fetch to automatically pay for 402 responses with TIP-20 stablecoins.
- [Accept One-Time Payments](/guide/machine-payments/one-time-payments): Charge per request on Tempo using the mppx charge intent. Each request triggers a TIP-20 transfer that settles in ~500ms.
- [Accept Pay-As-You-Go Payments](/guide/machine-payments/pay-as-you-go): Session-based billing on Tempo with MPP payment channels. Clients deposit funds, sign off-chain vouchers, and pay per request without on-chain latency.
- [Server Quickstart](/guide/machine-payments/server): Add payment gating to any HTTP endpoint on Tempo with mppx middleware for Next.js, Hono, Express, and the Fetch API.
- [Accept Streamed Payments](/guide/machine-payments/streamed-payments): Per-token billing over Server-Sent Events on Tempo. Stream content word-by-word and charge per unit using MPP sessions with SSE.
- [Installation](/guide/node/installation): Install Tempo node using pre-built binaries, build from source with Rust, or run with Docker. Get started in minutes with tempoup.
- [Network Upgrades and Releases](/guide/node/network-upgrades): Timeline and details for Tempo network upgrades and important releases for node operators.
- [Running an RPC Node](/guide/node/rpc): Set up and run a Tempo RPC node for API access. Download snapshots, configure systemd services, and monitor node health and sync status.
- [Node Security](/guide/node/security): Security best practices for Tempo node operators, covering key management, network configuration, release verification, and data integrity.
- [System Requirements](/guide/node/system-requirements): Minimum and recommended hardware specs for running Tempo RPC and validator nodes. CPU, RAM, storage, network, and port requirements.
- [Upgrade Cadence](/guide/node/upgrade-cadence): How Tempo schedules and communicates network upgrades, including timelines, notification windows, and what to expect as a node operator.
- [Running a validator node](/guide/node/validator): Overview of running a Tempo validator node.
- [Managing validator keys](/guide/node/validator-keys): Generate, rotate, and recover validator signing keys and shares.
- [Controlling validator lifecycle](/guide/node/validator-lifecycle): Start, stop, register, rotate, deactivate, and transfer ownership of your Tempo validator.
- [Monitoring a validator](/guide/node/validator-monitoring): Monitor validator health with metrics, Grafana dashboards, and log management.
- [Validator Onboarding](/guide/node/validator-setup): Generate signing keys and run your Tempo validator node for the first time.
- [Checking validator status](/guide/node/validator-status): Understand validator state transitions, check your validator's participation status, and query on-chain status.
- [Troubleshooting and FAQ](/guide/node/validator-troubleshooting): Common issues and solutions for Tempo validator operators.
- [Accept a Payment](/guide/payments/accept-a-payment): Accept stablecoin payments in your application. Verify transactions, listen for transfer events, and reconcile payments using memos.
- [Pay Fees in Any Stablecoin](/guide/payments/pay-fees-in-any-stablecoin): Configure users to pay transaction fees in any supported stablecoin. Eliminate the need for a separate gas token with Tempo's flexible fee system.
- [Send a Payment](/guide/payments/send-a-payment): Send stablecoin payments between accounts on Tempo. Include optional memos for reconciliation and tracking with TypeScript, Rust, or Solidity.
- [Send Parallel Transactions](/guide/payments/send-parallel-transactions): Submit multiple transactions concurrently using Tempo's expiring nonce system under-the-hood.
- [Sponsor User Fees](/guide/payments/sponsor-user-fees): Enable gasless transactions by sponsoring fees for your users. Set up a fee payer service and improve UX by removing friction from payment flows.
- [Attach a Transfer Memo](/guide/payments/transfer-memos)
- [Use virtual addresses for deposits](/guide/payments/virtual-addresses): Register a virtual-address master, derive deposit addresses offchain, and watch TIP-20 deposits land directly in the registered wallet.
- [Connect to a Zone](/guide/private-zones/connect-to-a-zone): Connect to Tempo Zones on testnet using Zone A and Zone B RPC URLs, chain IDs, and a minimal viem client setup for private flows.
- [Deposit to a Zone](/guide/private-zones/deposit-to-a-zone): Deposit pathUSD from your public-chain balance into Zone A and confirm the resulting zone balance.
- [Send tokens across zones](/guide/private-zones/send-tokens-across-zones): Send pathUSD from Zone A into Zone B by routing a same-token withdrawal through Tempo's L1 router and confirming the target deposit.
- [Send tokens within a zone](/guide/private-zones/send-tokens-within-a-zone): Send pathUSD inside Zone A with a signed zone transfer and confirm the updated zone balance.
- [Swap stablecoins across zones](/guide/private-zones/swap-across-zones): Swap pathUSD from Zone A into betaUSD on Zone B by routing a zone withdrawal through Tempo's L1 router and confirming the target deposit.
- [Withdraw from a Zone](/guide/private-zones/withdraw-from-a-zone): Withdraw pathUSD from Zone A back to your public-chain balance with a direct zone outbox withdrawal.
- [Executing Swaps](/guide/stablecoin-dex/executing-swaps): Learn to execute instant stablecoin swaps on Tempo's DEX. Get price quotes, set slippage protection, and batch approvals with swaps.
- [Managing Fee Liquidity](/guide/stablecoin-dex/managing-fee-liquidity): Add and remove liquidity in the Fee AMM to enable stablecoin fee conversions. Monitor pools, check LP balances, and rebalance reserves.
- [Providing Liquidity](/guide/stablecoin-dex/providing-liquidity): Place limit and flip orders to provide liquidity on the Stablecoin DEX orderbook. Learn to manage orders and set prices using ticks.
- [View the Orderbook](/guide/stablecoin-dex/view-the-orderbook): Inspect Tempo's onchain orderbook using SQL queries. View spreads, order depth, individual orders, and recent trade prices with indexed data.
- [Add Funds to Your Balance](/guide/use-accounts/add-funds): Get test stablecoins on Tempo Testnet using the faucet. Request pathUSD, AlphaUSD, BetaUSD, and ThetaUSD tokens for development and testing.
- [Authorize access keys](/guide/use-accounts/authorize-access-keys): Authorize access keys on Tempo. Use a secondary signing key to send transactions without repeated passkey prompts, with spending limits and expiry for security.
- [Batch Transactions](/guide/use-accounts/batch-transactions)
- [Connect to Wallets](/guide/use-accounts/connect-to-wallets): Connect your application to EVM-compatible wallets like MetaMask on Tempo. Set up Wagmi connectors and add the Tempo network to user wallets.
- [Embed Passkey Accounts](/guide/use-accounts/embed-passkeys): Create domain-bound passkey accounts on Tempo using WebAuthn for secure, passwordless authentication with biometrics like Face ID and Touch ID.
- [Embed Tempo Wallet](/guide/use-accounts/embed-tempo-wallet): Embed the Tempo Wallet dialog into your application for a universal wallet experience with account management, passkeys, and fee sponsorship.
- [Scheduled Transactions](/guide/use-accounts/scheduled-transactions)
- [WebAuthn & P256 Signatures](/guide/use-accounts/webauthn-p256-signatures)
- [Onchain FX](/learn/tempo/fx): Access foreign exchange liquidity directly onchain with regulated non-USD stablecoin issuers and multi-currency fee payments on Tempo.
- [Agentic Payments](/learn/tempo/machine-payments): The Machine Payments Protocol (MPP) is an open standard for machine-to-machine payments, co-authored by Stripe and Tempo.
- [Tempo Transactions](/learn/tempo/modern-transactions): Native support for gas sponsorship, batch transactions, scheduled payments, and passkey authentication built into Tempo's protocol.
- [TIP-20 Tokens](/learn/tempo/native-stablecoins): Tempo's stablecoin token standard with payment lanes, stable fees, reconciliation memos, and built-in compliance for regulated issuers.
- [Performance](/learn/tempo/performance): High throughput and sub-second finality built on Reth SDK and Simplex Consensus for payment applications requiring instant settlement.
- [Privacy](/learn/tempo/privacy): Explore Tempo's opt-in privacy features enabling private balances and confidential transfers while maintaining issuer compliance.
- [Power AI agents with programmable money](/learn/use-cases/agentic-commerce): Power autonomous AI agents with programmable stablecoin payments for goods, services, and digital resources in real time.
- [Bring embedded finance to life with stablecoins](/learn/use-cases/embedded-finance): Enable platforms and marketplaces to streamline partner payouts, lower payment costs, and launch rewarding loyalty programs.
- [Send global payouts instantly](/learn/use-cases/global-payouts): Deliver instant, low-cost payouts to contractors, merchants, and partners worldwide with stablecoins, bypassing slow banking rails.
- [Enable true pay-per-use pricing](/learn/use-cases/microtransactions): Enable true pay-per-use pricing with sub-cent payments for APIs, content, IoT services, and machine-to-machine commerce.
- [Stablecoins for Payroll](/learn/use-cases/payroll): Faster payroll funding, cheaper cross-border payouts, and new revenue streams for payroll providers using stablecoins.
- [Send money home faster and cheaper](/learn/use-cases/remittances): Send cross-border payments faster and cheaper with stablecoins, eliminating correspondent banks and reducing transfer costs.
- [Move treasury liquidity instantly across borders](/learn/use-cases/tokenized-deposits): Move treasury liquidity instantly across borders with real-time visibility into global cash positions using tokenized deposits.
- [Consensus and Finality](/protocol/blockspace/consensus): Tempo uses Simplex BFT via Commonware for deterministic sub-second finality with Byzantine fault tolerance.
- [Blockspace Overview](/protocol/blockspace/overview): Technical specification for Tempo block structure including header fields, payment lanes, and system transaction ordering.
- [Payment Lane Specification](/protocol/blockspace/payment-lane-specification): Technical specification for Tempo payment lanes ensuring dedicated blockspace for payment transactions with predictable fees during congestion.
- [DEX Balance](/protocol/exchange/exchange-balance): Hold token balances directly on the Stablecoin DEX to save gas costs on trades, receive maker proceeds automatically, and trade more efficiently.
- [Executing Swaps](/protocol/exchange/executing-swaps): Learn how to execute swaps and quote prices on Tempo's Stablecoin DEX with exact-in and exact-out swap functions and slippage protection.
- [Providing Liquidity](/protocol/exchange/providing-liquidity): Provide liquidity on Tempo's DEX using limit orders and flip orders. Earn spreads while facilitating stablecoin trades with price-time priority.
- [Quote Tokens](/protocol/exchange/quote-tokens): Quote tokens determine trading pairs on Tempo's DEX. Each TIP-20 specifies a quote token, with pathUSD available as an optional neutral choice.
- [Stablecoin DEX](/protocol/exchange/spec): Technical specification for Tempo's enshrined DEX with price-time priority orderbook, flip orders, and multi-hop routing for stablecoin trading.
- [Fee AMM Overview](/protocol/fees/fee-amm/): Understand how the Fee AMM automatically converts transaction fees between stablecoins, enabling users to pay in any supported token.
- [Fee Specification](/protocol/fees/spec-fee): Technical specification for Tempo's fee system covering multi-token fee payment, fee sponsorship, token preferences, and validator payouts.
- [Fee AMM Specification](/protocol/fees/spec-fee-amm): Technical specification for the Fee AMM enabling automatic stablecoin conversion for transaction fees with fixed-rate swaps and MEV protection.
- [TIP-20 Rewards](/protocol/tip20-rewards/overview): Built-in reward distribution mechanism for TIP-20 tokens enabling efficient, opt-in proportional rewards to token holders at scale.
- [TIP-20 Rewards Distribution](/protocol/tip20-rewards/spec): Technical specification for the TIP-20 reward distribution system using reward-per-token accumulator pattern for scalable pro-rata rewards.
- [TIP-20 Token Standard](/protocol/tip20/overview): TIP-20 is Tempo's native token standard for stablecoins with built-in fee payment, payment lanes, transfer memos, and compliance policies.
- [TIP20](/protocol/tip20/spec): Technical specification for TIP-20, the optimized token standard extending ERC-20 with memos, rewards distribution, and policy integration.
- [Virtual addresses for TIP-20 deposits](/protocol/tip20/virtual-addresses): Understand how TIP-20 virtual addresses work, why they remove sweep transactions, and how to attribute forwarded deposits on Tempo.
- [TIP-403 Policy Registry](/protocol/tip403/overview): Learn how TIP-403 enables TIP-20 tokens to enforce access control through a shared policy registry with whitelist and blacklist support.
- [Overview](/protocol/tip403/spec): Technical specification for TIP-403, the policy registry system enabling whitelist and blacklist access control for TIP-20 tokens on Tempo.
- [TIP Title](/protocol/tips/_tip_template): Short description for SEO
- [TIP Process](/protocol/tips/tip-0000): Defines the Tempo Improvement Proposal lifecycle from draft to production.
- [State Creation Cost Increase](/protocol/tips/tip-1000): Increased gas costs for state creation operations to protect Tempo from adversarial state growth attacks.
- [Place-only mode for next quote token](/protocol/tips/tip-1001): A new DEX function for creating trading pairs against a token's staged next quote token, to allow orders to be placed on it.
- [Prevent crossed orders and allow same-tick flip orders](/protocol/tips/tip-1002): Changes to the Stablecoin DEX that prevent placing orders that would cross existing orders on the opposite side of the book, and allow flip orders to flip to the same tick.
- [Client order IDs](/protocol/tips/tip-1003): Addition of client order IDs to the Stablecoin DEX, allowing users to specify their own order identifiers for idempotency and easier order tracking.
- [Permit for TIP-20](/protocol/tips/tip-1004): Addition of EIP-2612 permit functionality to TIP-20 tokens, enabling gasless approvals via off-chain signatures.
- [Fix ask swap rounding loss](/protocol/tips/tip-1005): A fix for a rounding bug in the Stablecoin DEX where partial fills on ask orders can cause small amounts of quote tokens to be lost.
- [Burn At for TIP-20 Tokens](/protocol/tips/tip-1006): The burnAt function for TIP-20 tokens, enabling authorized administrators to burn tokens from any address.
- [Fee Token Introspection](/protocol/tips/tip-1007): Addition of fee token introspection functionality to the FeeManager precompile, enabling smart contracts to query the fee token being used for the current transaction.
- [Expiring Nonces](/protocol/tips/tip-1009): Time-bounded replay protection using transaction hashes instead of sequential nonce management.
- [Mainnet Gas Parameters](/protocol/tips/tip-1010): Initial gas parameters for Tempo mainnet launch including base fee pricing, payment lane capacity, and transaction gas limits.
- [Enhanced Access Key Permissions](/protocol/tips/tip-1011): Extends Access Keys with periodic spending limits, destination/function scoping, and limited calldata recipient scoping.
- [Compound Transfer Policies](/protocol/tips/tip-1015): Extends TIP-403 with compound policies that specify different authorization rules for senders and recipients.
- [Exempt Storage Creation from Gas Limits](/protocol/tips/tip-1016): Storage creation gas costs are charged but don't count against transaction or block gas limits, using a reservoir model aligned with EIP-8037 for correct GAS opcode semantics and EVM compatibility.
- [Validator Config V2 precompile](/protocol/tips/tip-1017): Validator Config V2 precompile for improved management of consensus participants
- [Signature Verification Precompile](/protocol/tips/tip-1020): A precompile for verifying Tempo signatures onchain.
- [Virtual Addresses for TIP-20 Deposit Forwarding](/protocol/tips/tip-1022): Precompile-native virtual addresses that auto-forward TIP-20 deposits to a registered master wallet, eliminating sweep transactions.
- [Allow same-tick flip orders](/protocol/tips/tip-1030): Relaxes the placeFlip validation to allow flipTick to equal tick, enabling flip orders that flip to the same price.
- [Embed consensus context in the block Header](/protocol/tips/tip-1031): Embed consensus context into the block header
- [T2 Hardfork Bug Fixes](/protocol/tips/tip-1036): Meta TIP collecting all audit-driven bug fixes and hardening changes gated behind the T2 hardfork.
- [T3 Hardfork Meta TIP](/protocol/tips/tip-1038): Meta TIP collecting all bug fixes, security hardening, and gas correctness changes gated behind the T3 hardfork.
- [Revert code creation and set code at addresses with TIP-20 prefix](/protocol/tips/tip-1047): Reject contract creation and EIP-7702 delegations that produce addresses in the TIP-20 reserved prefix range
- [Account Keychain Precompile](/protocol/transactions/AccountKeychain): Technical specification for the Account Keychain precompile managing access keys with expiry timestamps, spending limits, and post-T3 call-scope restrictions.
- [EIP-4337 Comparison](/protocol/transactions/eip-4337): How Tempo Transactions achieve EIP-4337 goals without bundlers, paymasters, or EntryPoint contracts.
- [EIP-7702 Comparison](/protocol/transactions/eip-7702): How Tempo Transactions extend EIP-7702 delegation with additional signature schemes and native features.
- [Tempo Transaction](/protocol/transactions/spec-tempo-transaction): Technical specification for the Tempo transaction type (EIP-2718) with WebAuthn signatures, parallelizable nonces, gas sponsorship, and batching.
- [T2 Network Upgrade](/protocol/upgrades/t2): Details and timeline for the T2 network upgrade including compound transfer policies, Validator Config V2, permit support for TIP-20, and audit-driven bug fixes.
- [T3 Network Upgrade](/protocol/upgrades/t3): Details and timeline for the T3 network upgrade, including enhanced access keys, signature verification, and virtual addresses.
- [Accounts](/protocol/zones/accounts): Account-scoped access control on Tempo Zones, including private balances, private allowances, and the two-layer privacy model.
- [Tempo Zone Architecture](/protocol/zones/architecture): Architecture of Tempo Zones, including contract layout, sequencer management, chain IDs, and the trust model.
- [Zone Bridging](/protocol/zones/bridging): Deposit and withdraw TIP-20 tokens between Tempo Mainnet and Tempo Zones, including encrypted deposits and composable withdrawal callbacks.
- [Execution & Gas](/protocol/zones/execution): Specification for gas accounting, fee tokens, fixed TIP-20 gas costs, contract creation limits, and token management on Tempo Zones.
- [Zone Proving](/protocol/zones/proving): Batch submission and proof verification for Tempo zones, including the state transition function, ZK and TEE deployment modes, and ancestry proofs.
- [Zone RPC](/protocol/zones/rpc): Authenticated JSON-RPC interface for Tempo Zones with per-account scoping, timing side channel mitigations, and event filtering.
- [Foundry Integration](/sdk/foundry/mpp): Use Foundry tools (cast, forge, anvil, chisel) with MPP-gated RPC endpoints on Tempo — automatic 402 handling with zero config.
- [Signature Verification in Foundry](/sdk/foundry/signature-verifier): Verify secp256k1, P256, and WebAuthn signatures in smart contracts using the TIP-1020 SignatureVerifier precompile with Foundry.
- [Pay for Agent-to-Agent Services](/guide/machine-payments/use-cases/agent-to-agent): Hire agents for coding, design, writing, and email with Auto.exchange and AgentMail via MPP stablecoin payments on Tempo.
- [Pay for AI Models Per Request](/guide/machine-payments/use-cases/ai-model-access): Let your agents call OpenAI, Anthropic, Gemini, Mistral, and other LLMs without API keys using MPP stablecoin payments on Tempo.
- [Pay for Blockchain Data and Analytics](/guide/machine-payments/use-cases/blockchain-data): Query on-chain data from Alchemy, Allium, Nansen, Dune, and Codex using MPP stablecoin payments on Tempo — no API keys required.
- [Pay for Browser Automation and Web Scraping](/guide/machine-payments/use-cases/browser-automation): Run headless browsers, solve CAPTCHAs, and scrape web pages using Browserbase, 2Captcha, and Oxylabs via MPP on Tempo.
- [Pay for Compute and Code Execution](/guide/machine-payments/use-cases/compute-and-code-execution): Run code, deploy containers, and access GPU compute via MPP with stablecoin payments on Tempo — no cloud accounts needed.
- [Pay for Data Enrichment and Lead Generation](/guide/machine-payments/use-cases/data-enrichment-and-leads): Enrich contacts, find emails, profile companies, and generate leads using Apollo, Hunter, Clado, and more via MPP on Tempo.
- [Pay for Financial and Market Data](/guide/machine-payments/use-cases/financial-data): Access stock prices, forex rates, SEC filings, crypto data, and economic indicators via MPP with stablecoin payments on Tempo.
- [Pay for Image, Video, and Audio Generation](/guide/machine-payments/use-cases/image-and-media-generation): Generate images, videos, audio, and speech with fal.ai, OpenAI, Gemini, and Deepgram via MPP stablecoin payments on Tempo.
- [Pay for Maps, Geocoding, and Location Data](/guide/machine-payments/use-cases/location-and-maps): Access Google Maps, Mapbox, weather, and flight data via MPP with stablecoin payments on Tempo — no API keys required.
- [Monetize Your API with Agentic Payments](/guide/machine-payments/use-cases/monetize-your-api): Accept stablecoin payments for your API using MPP on Tempo. Charge per request without requiring signups, billing accounts, or API keys.
- [Pay for Object Storage and Git Repos](/guide/machine-payments/use-cases/storage): Store files and create Git repositories using MPP with stablecoin payments on Tempo — no cloud accounts required.
- [Pay for Translation and Language Services](/guide/machine-payments/use-cases/translation-and-language): Translate text, transcribe audio, and process language using DeepL, Deepgram, and other MPP services with stablecoin payments on Tempo.
- [Pay for Web Search and Research](/guide/machine-payments/use-cases/web-search-and-research): Let agents search the web, extract content, and crawl pages using MPP services like Parallel, Exa, Brave, and Firecrawl with stablecoin payments.
- [Setup](/sdk/typescript/prool/setup): Set up infinite pooled Tempo node instances in TypeScript with Prool for testing and local development of blockchain applications.
-->

# Getting Started

## Overview

The Tempo Accounts SDK is a TypeScript library for applications and wallets to create, manage, and interact with accounts on Tempo.

### Demo

Try sign in and make a payment on Tempo using the Accounts SDK.

<Demo.Container name="Make a Payment" footerVariant="source" src="tempoxyz/accounts/tree/main/examples/basic">
  <Connect stepNumber={1} />

  <AddFunds stepNumber={2} />

  <SendPayment stepNumber={3} last />
</Demo.Container>

### Quick Prompt

You can integrate the Accounts SDK, and achieve a flow like the demo above by prompting your agent:

```
Read docs.tempo.xyz/accounts and integrate Tempo Wallet into my application
```

### Architecture

The Accounts SDK is a router between your application and a signing [Adapter](/accounts/api/adapters) (e.g. the Tempo Wallet dialog), exposed as an [EIP-1193 Provider](https://eips.ethereum.org/EIPS/eip-1193).

Adapters handle where keys live and who handles signing. The Accounts SDK currently ships with two adapters:

| Adapter | Description |
| --- | --- |
| [**Tempo Wallet**](/guide/use-accounts/embed-tempo-wallet) | Delegates signing to [`wallet.tempo.xyz`](https://wallet.tempo.xyz) via an iframe dialog or popup. One passkey, one account, portable across apps.
| [**Domain-bound Passkeys**](/guide/use-accounts/embed-passkeys) | The app (or wallet) handles passkey ceremonies and signing in-process on its own domain.

Your application interacts with the SDK through standard JSON-RPC methods (via [Wagmi](https://wagmi.sh/) or [Viem](https://viem.sh/)).

An example of a high-level flow of an Application requesting for a user to perform an action with their Tempo Wallet is shown below:

<StaticMermaidDiagram
  chart={`sequenceDiagram
  participant A as Application
  participant S as Accounts SDK
  participant W as wallet.tempo.xyz or Other

  A->>S: action request
  S->>W: routes request
  note over W: User approves with Passkey
  W-->>S: result
  S-->>A: result
`}
/>

## Install

The Tempo Accounts SDK is available as an [NPM package](https://www.npmjs.com/package/accounts) under `accounts`

:::code-group

```bash [npm]
npm i accounts
```

```bash [pnpm]
pnpm i accounts
```

```bash [bun]
bun i accounts
```

:::

## Wagmi Usage

The Tempo Accounts SDK is best used in conjunction with [Wagmi](https://wagmi.sh/) to provide a seamless experience for developers and end-users.

::::steps

### Set up Wagmi

Get started with Wagmi by following the [official guide](https://wagmi.sh/react/getting-started).

### Configure

After you have set up Wagmi, you can configure the Tempo Accounts SDK with `tempoWallet` from `wagmi/connectors` or `webAuthn` from `wagmi/tempo`.

:::code-group

```tsx twoslash [Tempo Wallet]
import { createConfig, http } from 'wagmi'
import { tempo } from 'wagmi/chains'
import { tempoWallet } from 'wagmi/connectors' // [!code hl]

export const wagmiConfig = createConfig({
  chains: [tempo],
  connectors: [tempoWallet()], // [!code hl]
  transports: {
    [tempo.id]: http(),
  },
})
```

```tsx twoslash [Domain-bound Passkeys]
import { createConfig, http } from 'wagmi'
import { tempo } from 'wagmi/chains'
import { webAuthn } from 'wagmi/tempo' // [!code hl]

export const wagmiConfig = createConfig({
  chains: [tempo],
  connectors: [webAuthn({ authUrl: '/auth' })], // [!code hl]
  transports: {
    [tempo.id]: http(),
  },
})
```

:::

:::info\[What connector should I use?]
Most apps should use **Tempo Wallet** - it provides a universal account experience with embedded onramp, access keys, and transaction orchestration. **Domain-bound Passkeys** is for apps that want to manage domain-bound passkey accounts directly. [Learn more](/accounts/faq#what-connector-should-i-use).
:::

:::tip
If you are using a wallet connection library and cannot supply a custom connector,
you can use `Provider.create()` to create a new provider instance, and inject itself
into the wallet connection library via [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963).

```tsx
import { Provider } from 'accounts'
Provider.create()
```

:::

### Use Accounts

You can now use [Wagmi Hooks](https://wagmi.sh/react/api/hooks) like `useConnect`, or [Tempo Hooks](https://wagmi.sh/tempo) like `useTransfer`.

```tsx twoslash
// @noErrors
import { useConnect, useConnectors } from 'wagmi'

function Connect() {
  const connect = useConnect()
  const connectors = useConnectors()

  return connectors?.map((connector) => (
    <button
      key={connector.uid}
      onClick={() => connect.connect({ connector })}
    >
      Connect
    </button>
  ))
}
```

### Next Steps

<Cards>
  <Card description="Embed Tempo Wallet or domain-bound passkeys into your app" icon="lucide:user-plus" to="/guide/use-accounts" title="Create & Use Accounts" />

  <Card description="Send and accept stablecoin payments on Tempo" icon="lucide:send" to="/guide/payments" title="Make Payments" />

  <Card description="Create and manage your own stablecoin on Tempo" icon="lucide:coins" to="/guide/issuance" title="Issue Stablecoins" />

  <Card description="Swap between stablecoins on the built-in exchange" icon="lucide:arrow-left-right" to="/guide/stablecoin-dex" title="Exchange Stablecoins" />

  <Card description="Hooks to connect wallets, sign transactions, and more" icon="<svg viewBox=&#x22;-80 -80 789 789&#x22; fill=&#x22;none&#x22; xmlns=&#x22;http://www.w3.org/2000/svg&#x22;><path fill-rule=&#x22;evenodd&#x22; clip-rule=&#x22;evenodd&#x22; d=&#x22;M71.788 366.47C71.788 386.294 87.8583 402.364 107.682 402.364H179.47C199.294 402.364 215.364 386.294 215.364 366.47L215.364 222.894C215.364 203.07 231.434 187 251.258 187C271.082 187 287.152 203.07 287.152 222.894V366.47C287.152 386.294 303.222 402.364 323.046 402.364H394.834C414.658 402.364 430.728 386.294 430.728 366.47V222.894C430.728 203.07 446.798 187 466.622 187C486.446 187 502.516 203.07 502.516 222.894V438.258C502.516 458.082 486.446 474.152 466.622 474.152H35.894C16.0703 474.152 0 458.082 0 438.258L1.26782e-05 222.894C1.40786e-05 203.07 16.0703 187 35.894 187C55.7177 187 71.788 203.07 71.788 222.894L71.788 366.47ZM581.142 482.698C607.573 482.698 629 461.271 629 434.84C629 408.408 607.573 386.981 581.142 386.981C554.71 386.981 533.283 408.408 533.283 434.84C533.283 461.271 554.71 482.698 581.142 482.698Z&#x22; fill=&#x22;currentColor&#x22;/></svg>" to="https://wagmi.sh/react/api/hooks" title="Wagmi Hooks" />

  <Card description="Hooks to transfer stablecoins, interact with the stablecoin DEX, and read token data" icon="<svg viewBox=&#x22;0 0 178 178&#x22; fill=&#x22;none&#x22; xmlns=&#x22;http://www.w3.org/2000/svg&#x22;><path d=&#x22;M58.2683 51.1115C58.6089 50.0871 59.567 49.3954 60.6469 49.3954H136.216C137.116 49.3954 137.753 50.2773 137.468 51.1326L129.819 74.0819C129.478 75.1062 128.519 75.798 127.439 75.798H105.18C104.1 75.798 103.142 76.4897 102.801 77.5141L86.3416 126.889C86.001 127.913 85.0429 128.605 83.963 128.605H60.1428C59.2425 128.605 58.606 127.723 58.8912 126.868L75.3344 77.5372C75.6193 76.6819 74.9831 75.7999 74.0829 75.7999H51.8705C50.9702 75.7999 50.3338 74.918 50.6188 74.0626L58.2683 51.1115Z&#x22; fill=&#x22;currentColor&#x22;/></svg>" to="https://wagmi.sh/tempo" title="Tempo Hooks" />
</Cards>

::::

## Vanilla + Viem Usage

You can get started with the Tempo Accounts SDK by creating a new `Provider` instance.
Once set up, you can use the provider to interact with accounts via JSON-RPC, or use [Viem Actions](https://viem.sh/tempo) with `.getClient(){:js}`.

```tsx twoslash
// @noErrors
import { Provider } from 'accounts'
import { parseUnits } from 'viem'
import { tempoActions } from 'viem/tempo'

const provider = Provider.create()

const { accounts } = await provider.request({
  method: 'wallet_connect',
})

const client = provider.getClient().extend(tempoActions())

const { receipt } = await client.token.transferSync({
  token: '0x20c0000000000000000000000000000000000001',
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbb',
  amount: parseUnits('10', 6),
})
```

## Examples

Check out these examples to get started with the Tempo Accounts SDK.

| Example | Description | |
| --- | --- | --- |
| [Embed Tempo Wallet](https://github.com/tempoxyz/accounts/tree/main/examples/basic) | Wagmi-based setup using the `tempoWallet` connector to connect to Tempo Wallets. | [Guide](/guide/use-accounts/embed-tempo-wallet) |
| [Embed Domain-bound Passkeys](https://github.com/tempoxyz/accounts/tree/main/examples/domain-bound-webauthn) | Domain-bound passkey example using Wagmi and the `webAuthn` connector. | [Guide](/guide/use-accounts/embed-passkeys) |
| [CLI + Tempo Wallets](https://github.com/tempoxyz/accounts/tree/main/examples/cli) | Minimal CLI setup to connect and authorize local keys using Tempo Wallets. | |
| [Access Keys + Tempo Wallets](https://github.com/tempoxyz/accounts/tree/main/examples/with-access-key) | Authorize access keys using Tempo Wallets to submit transactions without prompts. | |
| [Access Keys + Domain-bound Passkeys](https://github.com/tempoxyz/accounts/tree/main/examples/with-access-key-and-webauthn) | Authorize access keys using domain-bound Passkeys. | |
| [Sponsor Fees + Tempo Wallets](https://github.com/tempoxyz/accounts/tree/main/examples/with-fee-payer) | Sponsor transactions via Tempo Wallets. | [Guide](/guide/payments/sponsor-user-fees) |
| [Sponsor Fees + Domain-bound Passkeys](https://github.com/tempoxyz/accounts/tree/main/examples/with-fee-payer-and-webauthn) | Sponsor transactions via domain-bound Passkeys. | [Guide](/guide/payments/sponsor-user-fees) |

## Secure Origins (HTTPS)

The Tempo Accounts SDK is designed to be used on secure origins (HTTPS). If you are using HTTP,
it will fallback to using a popup instead of an iframe. This is because
WebAuthn is not supported on iframes embedded on insecure origins (HTTP).

Web frameworks typically default to HTTP in development environments. You
will need to ensure to turn on HTTPS in development to leverage the iframe dialog.

### Portless

[Portless](https://github.com/vercel-labs/portless) replaces port numbers with stable, named `.localhost` URLs and can enable HTTPS with auto-generated certificates.

```sh
npm install -g portless
portless run dev
# → https://myapp.localhost
```

### Next.js

HTTPS can be enabled on Next.js' dev server by setting the `--experimental-https` flag on the `next dev` command.

```bash
next dev --experimental-https
```

### Vite

HTTPS can be enabled on Vite's dev server by installing and configuring the `vite-plugin-mkcert` plugin.

```bash
npm i vite-plugin-mkcert
```

:::code-group

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    mkcert(),
    react(),
  ],
})
```

:::

## Getting Help

Have questions or building something cool with the Accounts SDK?

Join the Telegram group to chat with the team and other devs: [@mpp\_devs](https://t.me/mpp_devs)

