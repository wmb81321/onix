#!/usr/bin/env tsx
/**
 * Convexo P2P — Buyer Agent (Link CLI path)
 *
 * Monitors trades for a buyer wallet address. When a trade reaches `deposited`,
 * calls the link-pay endpoint to create a Stripe Link spend request, then prints
 * the approval URL. The buyer (or their AI agent) approves the spend request;
 * once approved, the platform agent charges the card server-side and releases USDC.
 *
 * Usage:
 *   BUYER_ADDRESS=0x... FRONTEND_URL=https://... tsx scripts/buyer-agent.ts
 *
 * Environment:
 *   BUYER_ADDRESS             — the buyer's wallet address to monitor
 *   FRONTEND_URL              — base URL of the Next.js frontend
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS)
 *   POLL_INTERVAL_MS          — polling interval (default 10000)
 *   AUTO_APPROVE              — set to "1" to auto-open approval URLs
 *
 * The buyer must have registered their Stripe Link PM ID at /account first.
 * Run: npx @stripe/link-cli payment-methods list → copy csmrpd_... → /account
 */

import { createClient } from '@supabase/supabase-js'
import { execFile } from 'node:child_process'

const BUYER_ADDRESS  = process.env.BUYER_ADDRESS
const FRONTEND_URL   = process.env.FRONTEND_URL ?? 'http://localhost:3000'
const SUPABASE_URL   = process.env.SUPABASE_URL!
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!
const POLL_MS        = Number(process.env.POLL_INTERVAL_MS ?? 10_000)
const AUTO_APPROVE   = process.env.AUTO_APPROVE === '1'

if (!BUYER_ADDRESS) {
  console.error('[buyer-agent] BUYER_ADDRESS env var required')
  process.exit(1)
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[buyer-agent] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// Tracks trades we've already initiated a spend request for
const initiated = new Set<string>()

function openUrl(url: string) {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
  execFile(cmd, [url], () => { /* ignore errors */ })
}

async function checkAndInitiate() {
  const { data: trades, error } = await db
    .from('trades')
    .select('id, usd_amount, usdc_amount')
    .eq('buyer_address', BUYER_ADDRESS!.toLowerCase())
    .eq('status', 'deposited')

  if (error) {
    console.error('[buyer-agent] Supabase query error:', error.message)
    return
  }

  if (!trades || trades.length === 0) return

  for (const trade of trades) {
    if (initiated.has(trade.id)) continue

    console.log(`[buyer-agent] Trade ${trade.id} is ready — $${trade.usd_amount} for ${trade.usdc_amount} USDC`)
    console.log(`[buyer-agent] Initiating Stripe Link spend request…`)

    try {
      const res = await fetch(`${FRONTEND_URL}/api/trades/${trade.id}/link-pay`, {
        method: 'POST',
      })
      const data = await res.json() as {
        spendRequestId?: string
        approvalUrl?: string
        error?: string
        action?: string
      }

      if (!res.ok) {
        console.warn(`[buyer-agent] ✗ Trade ${trade.id} — ${data.error ?? res.status}`)
        if (data.action) console.warn(`[buyer-agent]   → ${data.action}`)
        continue
      }

      initiated.add(trade.id)
      console.log(`[buyer-agent] ✓ Spend request ${data.spendRequestId ?? 'created'}`)

      if (data.approvalUrl) {
        console.log(`[buyer-agent] Approval URL: ${data.approvalUrl}`)

        if (AUTO_APPROVE) {
          console.log(`[buyer-agent] AUTO_APPROVE=1 — opening URL in browser…`)
          openUrl(data.approvalUrl)
        } else {
          console.log(`[buyer-agent] → Open this URL (or have your agent approve it) to release USDC`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[buyer-agent] Network error on trade ${trade.id}:`, msg)
    }
  }
}

console.log(`[buyer-agent] Monitoring trades for ${BUYER_ADDRESS}`)
console.log(`[buyer-agent] Poll interval: ${POLL_MS}ms | Auto-approve: ${AUTO_APPROVE}`)
console.log(`[buyer-agent] Frontend: ${FRONTEND_URL}`)
console.log()

void checkAndInitiate()
setInterval(() => { void checkAndInitiate() }, POLL_MS)
