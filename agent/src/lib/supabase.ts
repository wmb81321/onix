import { createClient } from '@supabase/supabase-js'
import type { TradeStatus } from './schemas.js'

if (!process.env.SUPABASE_URL)              throw new Error('SUPABASE_URL missing')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')

// Service-role client — bypasses RLS. Agent only, never browser.
export const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export type { TradeStatus }

export async function updateTradeStatus(
  tradeId: string,
  status: TradeStatus,
  extra?: Record<string, unknown>,
) {
  const { error } = await db
    .from('trades')
    .update({ status, ...extra })
    .eq('id', tradeId)

  if (error) throw new Error(`Failed to update trade ${tradeId} → ${status}: ${error.message}`)
}
