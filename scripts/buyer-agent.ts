#!/usr/bin/env tsx
/**
 * p2pai — Buyer Agent v2.0.0 (payment-sent path)
 *
 * Monitors trades for a buyer wallet address. When a trade reaches `deposited`
 * (seller has deposited USDC into escrow), calls POST /api/trades/:id/payment-sent
 * to notify the platform that the buyer has sent fiat payment.
 *
 * Trade state machine:
 *   created → deposited → payment_sent → payment_confirmed → released → complete
 *
 * Usage:
 *   BUYER_ADDRESS=0x... FRONTEND_URL=https://... AGENT_API_KEY=... \
 *     tsx scripts/buyer-agent.ts
 *
 * Environment:
 *   BUYER_ADDRESS             — the buyer's wallet address to monitor
 *   FRONTEND_URL              — base URL of the Next.js frontend (default: http://localhost:3000)
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS for polling)
 *   AGENT_API_KEY             — Bearer token for agent-authenticated routes
 *   PAYMENT_METHOD            — payment method label (default: "bank_transfer")
 *   POLL_INTERVAL_MS          — polling interval in ms (default: 10000)
 */

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

const EnvSchema = z.object({
  BUYER_ADDRESS:             z.string().min(1, 'BUYER_ADDRESS is required'),
  FRONTEND_URL:              z.string().url().default('http://localhost:3000'),
  SUPABASE_URL:              z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  AGENT_API_KEY:             z.string().min(1, 'AGENT_API_KEY is required'),
  PAYMENT_METHOD:            z.string().default('bank_transfer'),
  POLL_INTERVAL_MS:          z.coerce.number().positive().default(10_000),
})

const envResult = EnvSchema.safeParse(process.env)
if (!envResult.success) {
  console.error('[buyer-agent] Invalid environment configuration:')
  for (const issue of envResult.error.issues) {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

const ENV = envResult.data

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TradeRow {
  id: string
  usd_amount: number
  usdc_amount: number
  status: string
}

interface PaymentSentResponse {
  ok: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const db = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)

// ---------------------------------------------------------------------------
// State — tracks trades already processed this session
// ---------------------------------------------------------------------------

const processed = new Set<string>()

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

function buildPaymentReference(tradeId: string): string {
  const slice = tradeId.replace(/-/g, '').slice(0, 8)
  const ts = Date.now()
  return `auto-${slice}-${ts}`
}

async function markPaymentSent(trade: TradeRow): Promise<void> {
  const paymentReference = buildPaymentReference(trade.id)

  console.log(`[buyer-agent] Trade ${trade.id} — $${trade.usd_amount} USD for ${trade.usdc_amount} USDC`)
  console.log(`[buyer-agent] Marking payment sent (method: ${ENV.PAYMENT_METHOD}, ref: ${paymentReference})`)

  const body = JSON.stringify({
    buyer_address:      ENV.BUYER_ADDRESS,
    payment_method:     ENV.PAYMENT_METHOD,
    payment_reference:  paymentReference,
  })

  const res = await fetch(`${ENV.FRONTEND_URL}/api/trades/${trade.id}/payment-sent`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ENV.AGENT_API_KEY}`,
    },
    body,
  })

  const data = await res.json() as PaymentSentResponse

  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }

  console.log(`[buyer-agent] ✓ Trade ${trade.id} — payment_sent (ref: ${paymentReference})`)
}

async function poll(): Promise<void> {
  const { data: trades, error } = await db
    .from('trades')
    .select('id, usd_amount, usdc_amount, status')
    .eq('buyer_address', ENV.BUYER_ADDRESS.toLowerCase())
    .eq('status', 'deposited')

  if (error) {
    console.error('[buyer-agent] Supabase query error:', error.message)
    return
  }

  if (!trades || trades.length === 0) return

  for (const trade of trades as TradeRow[]) {
    if (processed.has(trade.id)) continue

    // Mark as processed before the async call so a slow response doesn't
    // cause a duplicate attempt on the next poll tick.
    processed.add(trade.id)

    try {
      await markPaymentSent(trade)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[buyer-agent] ✗ Trade ${trade.id} failed: ${msg}`)
      // Remove from processed so we retry on the next poll cycle.
      processed.delete(trade.id)
    }
  }
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

console.log('[buyer-agent] ─────────────────────────────────────────────')
console.log(`[buyer-agent] p2pai Buyer Agent v2.0.0`)
console.log(`[buyer-agent] Watching for:   buyer_address = ${ENV.BUYER_ADDRESS}`)
console.log(`[buyer-agent]                  status        = deposited`)
console.log(`[buyer-agent] Payment method: ${ENV.PAYMENT_METHOD}`)
console.log(`[buyer-agent] Frontend URL:   ${ENV.FRONTEND_URL}`)
console.log(`[buyer-agent] Poll interval:  ${ENV.POLL_INTERVAL_MS}ms`)
console.log('[buyer-agent] ─────────────────────────────────────────────')
console.log()

void poll()
setInterval(() => { void poll() }, ENV.POLL_INTERVAL_MS)
