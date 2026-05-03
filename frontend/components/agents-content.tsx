'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="font-mono text-[10px] text-dim hover:text-ink transition-colors px-2 py-1 rounded border border-white/[0.07] hover:border-white/20"
    >
      {copied ? 'copied!' : 'copy'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-dim/50 uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

// ---------------------------------------------------------------------------
// MCP JSON snippet
// ---------------------------------------------------------------------------

const MCP_SNIPPET = `{
  "mcpServers": {
    "convexo-p2p": {
      "command": "npx",
      "args": ["-y", "convexo-p2p-mcp"],
      "env": {
        "CONVEXO_API_URL": "https://convexo-p2p.vercel.app",
        "CONVEXO_BUYER_ADDRESS": "0x<your-wallet>"
      }
    }
  }
}`

// ---------------------------------------------------------------------------
// Tools data
// ---------------------------------------------------------------------------

const TOOLS = [
  { name: 'list_orders',                  description: 'Browse open orders on the book',                 role: 'Both'   },
  { name: 'get_trade',                    description: 'Get trade status and next required action',       role: 'Both'   },
  { name: 'get_my_trades',                description: 'Your full trade history',                         role: 'Both'   },
  { name: 'create_order',                 description: 'Post a buy or sell order',                        role: 'Both'   },
  { name: 'match_order',                  description: 'Match an order to create a trade',                role: 'Both'   },
  { name: 'mark_payment_sent',            description: 'Buyer marks fiat payment sent (Zelle/Venmo/bank)', role: 'Buyer' },
  { name: 'confirm_payment',              description: 'Seller confirms fiat received — triggers USDC release', role: 'Seller' },
  { name: 'get_trade_status_description', description: 'Human-readable next step for a trade',            role: 'Both'   },
]

// ---------------------------------------------------------------------------
// Example conversation lines
// ---------------------------------------------------------------------------

type ConvLine =
  | { kind: 'agent';  text: string }
  | { kind: 'tool';   name: string; result: string }
  | { kind: 'output'; text: string }

const EXAMPLE: ConvLine[] = [
  { kind: 'agent',  text: 'Looking for open sell orders...' },
  { kind: 'tool',   name: 'list_orders', result: '{ type: "sell" }' },
  { kind: 'output', text: '[{ id: "ord_abc", usdc_amount: 100, rate: 1.05, ... }]' },
  { kind: 'agent',  text: 'Matching sell order ord_abc...' },
  { kind: 'tool',   name: 'match_order', result: '{ order_id: "ord_abc" }' },
  { kind: 'output', text: '{ trade_id: "trd_xyz", virtual_deposit_address: "0xc4fe...", deposit_deadline: "..." }' },
  { kind: 'agent',  text: 'Checking what to do next...' },
  { kind: 'tool',   name: 'get_trade_status_description', result: '{ trade_id: "trd_xyz" }' },
  { kind: 'output', text: '"Buyer needs to send 105 USD via Zelle/Venmo, then mark payment sent."' },
  { kind: 'agent',  text: 'Notifying platform that payment was sent...' },
  { kind: 'tool',   name: 'mark_payment_sent', result: '{ trade_id: "trd_xyz" }' },
  { kind: 'output', text: '{ status: "payment_sent", message: "Waiting for seller to confirm receipt." }' },
  { kind: 'agent',  text: 'Seller confirmed — USDC will release on-chain automatically.' },
]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AgentsContent() {
  return (
    <div className="space-y-14 max-w-3xl">

      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">
          Add Convexo P2P to your agent
        </h1>
        <p className="font-mono text-sm text-dim leading-relaxed max-w-2xl">
          Trade crypto&nbsp;&#8596;&nbsp;fiat autonomously.
          Convexo P2P exposes a full settlement API and MCP server —
          your agent can post orders, match trades, and execute payments
          without any human in the loop.
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-accent/30 bg-accent/[0.08] text-accent">
            Testnet live
          </span>
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-caution/30 bg-caution/[0.08] text-caution">
            Manual settlement
          </span>
        </div>
      </section>

      {/* Install via MCP */}
      <section className="space-y-4">
        <SectionLabel>Install via MCP</SectionLabel>
        <h2 className="text-base font-semibold text-ink">Add to Claude Code</h2>
        <p className="font-mono text-[12px] text-dim">
          Paste the following into your project&apos;s{' '}
          <span className="text-ink">.claude/mcp.json</span> (or global{' '}
          <span className="text-ink">~/.claude/mcp.json</span>):
        </p>
        <div className="relative bg-canvas rounded-xl border border-white/[0.07] p-4">
          <div className="absolute top-3 right-3">
            <CopyButton text={MCP_SNIPPET} />
          </div>
          <pre className="font-mono text-[12px] text-ink/80 overflow-x-auto pr-14 whitespace-pre">
            {MCP_SNIPPET}
          </pre>
        </div>
        <p className="font-mono text-[11px] text-dim/60">
          Or run directly:{' '}
          <span className="text-ink">npx convexo-p2p-mcp</span>
        </p>
        <p className="font-mono text-[11px] text-dim/50">
          Set <span className="text-ink">CONVEXO_BUYER_ADDRESS</span> to your wallet address.
          The MCP server uses it to scope trade lookups and actions.
        </p>
      </section>

      {/* Available tools */}
      <section className="space-y-4">
        <SectionLabel>Available tools</SectionLabel>
        <h2 className="text-base font-semibold text-ink">8 tools exposed via MCP</h2>
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
            <span className="font-mono text-[10px] text-dim/50 uppercase tracking-widest">Tool</span>
            <span className="font-mono text-[10px] text-dim/50 uppercase tracking-widest">Description</span>
            <span className="font-mono text-[10px] text-dim/50 uppercase tracking-widest">Role</span>
          </div>
          {TOOLS.map((tool, i) => (
            <div
              key={tool.name}
              className={`grid grid-cols-[1fr_2fr_auto] gap-4 px-4 py-3 items-center${
                i < TOOLS.length - 1 ? ' border-b border-white/[0.04]' : ''
              }`}
            >
              <span className="font-mono text-[12px] text-accent">{tool.name}</span>
              <span className="font-mono text-[12px] text-dim">{tool.description}</span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border${
                  tool.role === 'Buyer'
                    ? ' border-caution/30 bg-caution/[0.08] text-caution'
                    : ' border-white/[0.1] bg-white/[0.04] text-dim'
                }`}
              >
                {tool.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Example conversation */}
      <section className="space-y-4">
        <SectionLabel>Example agent session</SectionLabel>
        <h2 className="text-base font-semibold text-ink">What your agent sees</h2>
        <div className="bg-canvas rounded-xl border border-white/[0.07] p-4 space-y-2 overflow-x-auto">
          {EXAMPLE.map((line, i) => {
            if (line.kind === 'agent') {
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-mono text-[11px] text-dim/40 shrink-0 mt-0.5">agent</span>
                  <span className="font-mono text-[12px] text-ink/70">{line.text}</span>
                </div>
              )
            }
            if (line.kind === 'tool') {
              return (
                <div key={i} className="flex items-start gap-2 pl-4">
                  <span className="font-mono text-[11px] text-accent/60 shrink-0 mt-0.5">call</span>
                  <span className="font-mono text-[12px] text-accent">
                    {line.name}
                    <span className="text-dim/60 ml-1">({line.result})</span>
                  </span>
                </div>
              )
            }
            return (
              <div key={i} className="flex items-start gap-2 pl-4">
                <span className="font-mono text-[11px] text-dim/40 shrink-0 mt-0.5">out</span>
                <span className="font-mono text-[12px] text-dim/80 break-all">{line.text}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* For sellers */}
      <section className="space-y-3">
        <SectionLabel>For sellers</SectionLabel>
        <h2 className="text-base font-semibold text-ink">Seller agents</h2>
        <p className="font-mono text-[12px] text-dim leading-relaxed max-w-xl">
          Seller agents can post orders, monitor for matches, and deposit USDC automatically using
          the same MCP tools.{' '}
          <span className="text-ink">seller-agent.ts</span> reference implementation coming in Phase 9.
          Set <span className="text-ink">CONVEXO_SELLER_ADDRESS</span> in env to default all sell-side calls.
        </p>
      </section>

      {/* Direct API */}
      <section className="space-y-4">
        <SectionLabel>Direct API</SectionLabel>
        <h2 className="text-base font-semibold text-ink">REST endpoints</h2>
        <p className="font-mono text-[12px] text-dim">
          All tools proxy to the public REST API. You can call it directly if you prefer.
        </p>
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[auto_1fr] gap-4 px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
            <span className="font-mono text-[10px] text-dim/50 uppercase tracking-widest">Key</span>
            <span className="font-mono text-[10px] text-dim/50 uppercase tracking-widest">Value</span>
          </div>
          {[
            { k: 'Base URL',     v: 'https://convexo-p2p.vercel.app' },
            { k: 'Auth',         v: 'None required for read endpoints' },
            { k: 'Orders',       v: 'GET /api/orders?type=sell&status=open' },
            { k: 'Single order', v: 'GET /api/orders?id={order_id}' },
            { k: 'Trade',        v: 'GET /api/trades/{trade_id}' },
            { k: 'My trades',    v: 'GET /api/trades/by-user?address={addr}' },
          ].map(({ k, v }, i, arr) => (
            <div
              key={k}
              className={`grid grid-cols-[auto_1fr] gap-4 px-4 py-2.5 items-center${
                i < arr.length - 1 ? ' border-b border-white/[0.04]' : ''
              }`}
            >
              <span className="font-mono text-[12px] text-dim/60 w-28 shrink-0">{k}</span>
              <span className="font-mono text-[12px] text-ink/80">{v}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
