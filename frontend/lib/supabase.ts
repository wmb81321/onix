import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Types mirroring the Supabase schema
export type Order = Database['public']['Tables']['orders']['Row']
export type Trade = Database['public']['Tables']['trades']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type TradeStatus = Database['public']['Enums']['trade_status']
export type OrderStatus = Database['public']['Enums']['order_status']
export type OrderType = Database['public']['Enums']['order_type']
