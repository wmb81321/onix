// Auto-generate the real version with: supabase gen types typescript --project-id xhvbabjfsofgllupiypo
// This is the hand-written version matching 001_schema.sql

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          address: string
          stripe_account: string | null
          rating_avg: number
          trade_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'rating_avg' | 'trade_count' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_address: string
          type: Database['public']['Enums']['order_type']
          usdc_amount: number
          usd_amount: number
          rate: number
          status: Database['public']['Enums']['order_status']
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'status' | 'expires_at' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['orders']['Row'], 'status'>>
      }
      trades: {
        Row: {
          id: string
          order_id: string
          buyer_address: string
          seller_address: string
          usdc_amount: number
          usd_amount: number
          virtual_deposit_address: string
          stripe_payout_id: string | null
          stripe_account_id: string | null
          status: Database['public']['Enums']['trade_status']
          deposit_deadline: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['trades']['Row'], 'id' | 'status' | 'deposit_deadline' | 'created_at' | 'updated_at' | 'stripe_payout_id' | 'stripe_account_id'>
        Update: Partial<Pick<Database['public']['Tables']['trades']['Row'], 'status' | 'stripe_payout_id' | 'stripe_account_id'>>
      }
      ratings: {
        Row: {
          id: string
          trade_id: string
          rater_address: string
          ratee_address: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Enums: {
      order_type: 'buy' | 'sell'
      order_status: 'open' | 'matched' | 'cancelled' | 'expired'
      trade_status:
        | 'created'
        | 'deposited'
        | 'fee_paid'
        | 'fiat_sent'
        | 'released'
        | 'complete'
        | 'deposit_timeout'
        | 'stripe_failed'
        | 'refunded'
    }
  }
}
