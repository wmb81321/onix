---
name: tempo-docs
description: Answer Tempo blockchain questions using official documentation. Use when asked about Tempo protocol, TIP-20 tokens, Virtual Addresses, MPP, fees, stablecoin DEX, wagmi/tempo hooks, or any Tempo-related questions.
---

# Tempo Docs

Skill for navigating Tempo documentation and source code.

## Quick Context

Before using MCP tools, try fetching context directly:

- **llms.txt** – Concise index of all pages: `https://docs.tempo.xyz/llms.txt`
- **llms-full.txt** – Complete documentation in one file: `https://docs.tempo.xyz/llms-full.txt`
- **Markdown pages** – Append `.md` to any page URL (e.g. `https://docs.tempo.xyz/quickstart/integrate-tempo.md`)

Use `WebFetch` to fetch these when you need broad context or a quick answer.

## MCP Tools

The MCP server is named **`tempo`** in this project. Tool prefix: `mcp__tempo__*`

| Tool | Description |
| --- | --- |
| `mcp__tempo__list_pages` | List all documentation pages |
| `mcp__tempo__read_page` | Read a specific documentation page |
| `mcp__tempo__search_docs` | Search documentation |
| `mcp__tempo__list_sources` | List available source repositories |
| `mcp__tempo__list_source_files` | List files in a directory |
| `mcp__tempo__read_source_file` | Read a source code file |
| `mcp__tempo__get_file_tree` | Get recursive file tree |
| `mcp__tempo__search_source` | Search source code |

## Available Sources

- `tempoxyz/tempo` – Tempo node (Rust)
- `tempoxyz/tempo-ts` – TypeScript SDK
- `tempoxyz/accounts` – Accounts SDK (wagmi connectors, Hooks, Provider)
- `wevm/viem` – TypeScript Ethereum interface
- `wevm/wagmi` – React hooks for Ethereum

## Key Reference Pages

| Topic | URL |
| --- | --- |
| Integrate Tempo | `/quickstart/integrate-tempo` |
| Virtual Addresses | `/guide/payments/virtual-addresses` |
| Embed Tempo Wallet | `/guide/use-accounts/embed-tempo-wallet` |
| Tempo Wallet (wagmi) | `/accounts/wagmi/tempoWallet` |
| wallet_getBalances RPC | `/accounts/rpc/wallet_getBalances` |
| TIP-20 standard | `/protocol/tip20/overview` |
| Agentic / MPP payments | `/guide/machine-payments/` |
| Faucet | `/quickstart/faucet` |
| Predeployed contracts | `/quickstart/predeployed-contracts` |

## Workflow

1. **Quick lookup**: `WebFetch` on `https://docs.tempo.xyz/llms.txt` for an index, or append `.md` to a page URL for full content
2. **Search docs**: Use `mcp__tempo__search_docs` to find relevant pages
3. **Read pages**: Use `mcp__tempo__read_page` with the page path (e.g. `/accounts/rpc/wallet_getBalances`)
4. **Explore source**: Use `mcp__tempo__search_source` or `mcp__tempo__get_file_tree` to find implementations
5. **Read code**: Use `mcp__tempo__read_source_file` to examine specific files
