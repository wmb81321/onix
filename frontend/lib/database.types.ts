// Auto-generate the real version with: supabase gen types typescript --project-id xhvbabjfsofgllupiypo

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
        Insert: {
          address: string
          stripe_account?: string | null
        }
        Update: {
          stripe_account?: string | null
        }
        Relationships: []
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
        Insert: {
          user_address: string
          type: Database['public']['Enums']['order_type']
          usdc_amount: number
          usd_amount: number
          rate: number
        }
        Update: {
          status?: Database['public']['Enums']['order_status']
        }
        Relationships: [
          {
            foreignKeyName: 'orders_user_address_fkey'
            columns: ['user_address']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['address']
          },
        ]
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
          stripe_payment_intent_id: string | null
          status: Database['public']['Enums']['trade_status']
          deposit_deadline: string
          created_at: string
          updated_at: string
        }
        Insert: {
          order_id: string
          buyer_address: string
          seller_address: string
          usdc_amount: number
          usd_amount: number
          virtual_deposit_address: string
        }
        Update: {
          status?: Database['public']['Enums']['trade_status']
          stripe_payout_id?: string | null
          stripe_account_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'trades_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
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
        Insert: {
          trade_id: string
          rater_address: string
          ratee_address: string
          score: number
          comment?: string | null
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'ratings_trade_id_fkey'
            columns: ['trade_id']
            isOneToOne: false
            referencedRelation: 'trades'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
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
