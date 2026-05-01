SDK Features
SDK Features
Feature parity across TypeScript, Go, and Python SDKs

​
SDK Features
This page tracks which features are implemented in each SDK (TypeScript, Go, Python v2).
​
Core
Component	TypeScript	Go	Python
Server	✅	✅	✅
Client	✅	✅	✅
Facilitator	✅	✅	✅
​
HTTP Framework Integrations
Role	TypeScript	Go	Python
Server	Express, Hono, Next.js, Fastify	Gin, net/http, Echo	FastAPI, Flask
Client	Fetch, Axios	net/http	httpx, requests
​
Networks
Network	TypeScript	Go	Python
evm (EIP-155)	✅	✅	✅
svm (Solana)	✅	✅	✅
avm (Algorand)	✅	❌	❌
stellar	✅	❌	❌
aptos	✅	❌	❌
​
Mechanisms
Mechanism	TypeScript	Go	Python
exact/evm (EIP-3009)	✅	✅	✅
exact/evm (Permit2)	✅	✅	✅
exact/svm (SPL)	✅	✅	✅
exact/avm (ASA)	✅	❌	❌
exact/stellar (Soroban)	✅	❌	❌
exact/aptos (Fungible Assets)	✅	❌	❌
upto/evm (Permit2)	✅	✅	✅
​
Extensions
Extension	TypeScript	Go	Python
bazaar (server)	✅	✅	✅
bazaar (facilitator client)	✅	✅	✅
sign-in-with-x	✅	❌	❌
payment-identifier	✅	✅	✅
offer-receipt	✅	❌	❌
eip2612-gas-sponsoring	✅	✅	✅
erc20-approval-gas-sponsoring	✅	✅	✅
​
Client Hooks
Hook	TypeScript	Go	Python
onBeforePaymentCreation	✅	✅	✅
onAfterPaymentCreation	✅	✅	✅
onPaymentCreationFailure	✅	✅	✅
onPaymentRequired (HTTP)	✅	❌	❌
​
Server Hooks
Hook	TypeScript	Go	Python
onBeforeVerify	✅	✅	✅
onAfterVerify	✅	✅	✅
onVerifyFailure	✅	✅	✅
onBeforeSettle	✅	✅	✅
onAfterSettle	✅	✅	✅
onSettleFailure	✅	✅	✅
onProtectedRequest (HTTP)	✅	✅	❌
​
Facilitator Hooks
Hook	TypeScript	Go	Python
onBeforeVerify	✅	✅	✅
onAfterVerify	✅	✅	✅
onVerifyFailure	✅	✅	✅
onBeforeSettle	✅	✅	✅
onAfterSettle	✅	✅	✅
onSettleFailure	✅	✅	✅
​
Extension Hooks
Hook	TypeScript	Go	Python
enrichDeclaration	✅	✅	✅
enrichPaymentRequiredResponse	✅	❌	❌
enrichSettlementResponse	✅	❌	❌
​
MCP (Model Context Protocol)
Feature	TypeScript	Go	Python
MCP server payment wrapper	✅	✅	✅
MCP client (auto-pay tools)	✅	✅	✅
Bazaar discovery for MCP tools	✅	✅	✅
​
HTTP Server Features
Feature	TypeScript	Go	Python
dynamicPayTo	✅	✅	✅
dynamicPrice	✅	✅	✅
paywall (browser UI)	✅	✅	✅
Previous
Migration Guide: V1 to V2
This guide helps you migrate from x402 V1 to V2. The V2 protocol introduces standardized identifiers, improved type safety, and a more modular architecture.
Ask a question...

Powered by