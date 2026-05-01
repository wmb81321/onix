Using Tempo with AI
Tempo Wallet
Give your agent a wallet with spend controls to discover and pay for services on demand.

Tempo Docs
Feed your agent Tempo docs via skills, llms.txt, Markdown pages, and MCP.

Tempo Wallet
The Tempo CLI gives agents a wallet with built-in spend controls and service discovery. Agents use tempo wallet to manage keys and balances, and tempo request to pay for services on demand.

Paste this into your agent to set up a Tempo Wallet:

Claude Code
Amp
Codex CLI
claude -p "Read https://tempo.xyz/SKILL.md and set up Tempo Wallet"

Tempo Docs
Docs skill
Install the Tempo Docs skill to give AI coding agents access to Tempo documentation, source code via MCP, and examples:

npx skills add tempoxyz/docs

Once installed, the agent uses it automatically when relevant tasks are detected.

Read docs as Markdown
Every page on this site is available as plain Markdown — append .md to any URL:

https://docs.tempo.xyz/quickstart/integrate-tempo.md

For LLM consumption, two llms.txt files are served at the root:

URL	Contents
/llms.txt	Concise index of all pages with titles and descriptions
/llms-full.txt	Complete documentation in a single file
MCP server
The docs include a built-in Model Context Protocol (MCP) server for programmatic navigation of documentation and source code.

Claude Code
Codex CLI
Amp
claude mcp add --transport http tempo https://docs.tempo.xyz/api/mcp

Or configure manually:

{
  "mcpServers": {
    "tempo-docs": {
      "url": "https://docs.tempo.xyz/api/mcp"
    }
  }
}