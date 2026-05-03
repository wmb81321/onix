// Auto-generate the real version with: supabase gen types typescript --project-id xhvbabjfsofgllupiypo

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          address: string
          payment_methods: Array<{ type: string; label: string; value: string }>
          rating_avg: number
          trade_count: number
          created_at: string
          // Legacy Stripe columns — kept for existing rows, not used in new flow
          stripe_account: string | null
          link_payment_method_id: string | null
          stripe_customer_id: string | null
          stripe_buyer_pm_id: string | null
          stripe_buyer_card_brand: string | null
          stripe_buyer_card_last4: string | null
        }
        Insert: {
          address: string
          payment_methods?: Array<{ type: string; label: string; value: string }>
        }
        Update: {
          payment_methods?: Array<{ type: string; label: string; value: string }>
          rating_avg?: number
          trade_count?: number
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
          virtual_deposit_address: string | null
          service_fee_paid_at: string | null
          service_fee_tx_hash: string | null
          // Migration 008 — payment methods snapshotted at order creation; private
          seller_payment_methods: Array<{ type: string; label: string; value: string }> | null
        }
        Insert: {
          id?: string
          user_address: string
          type: Database['public']['Enums']['order_type']
          usdc_amount: number
          usd_amount: number
          rate: number
          virtual_deposit_address?: string | null
          service_fee_paid_at?: string | null
          service_fee_tx_hash?: string | null
          seller_payment_methods?: Array<{ type: string; label: string; value: string }> | null
        }
        Update: {
          status?: Database['public']['Enums']['order_status']
          virtual_deposit_address?: string | null
          service_fee_paid_at?: string | null
          service_fee_tx_hash?: string | null
          seller_payment_methods?: Array<{ type: string; label: string; value: string }> | null
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
          status: Database['public']['Enums']['trade_status']
          deposit_deadline: string
          // Payment fields (migration 006)
          payment_method: string | null
          payment_reference: string | null
          payment_proof_url: string | null
          payment_sent_at: string | null
          payment_confirmed_at: string | null
          // Legacy Stripe columns
          stripe_payout_id: string | null
          stripe_account_id: string | null
          stripe_payment_intent_id: string | null
          link_spend_request_id: string | null
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
          payment_method?: string | null
          payment_reference?: string | null
          payment_proof_url?: string | null
          payment_sent_at?: string | null
          payment_confirmed_at?: string | null
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
        | 'payment_sent'
        | 'payment_confirmed'
        | 'released'
        | 'complete'
        | 'deposit_timeout'
        | 'disputed'
        | 'refunded'
        | 'fee_paid'
        | 'fiat_sent'
        | 'stripe_failed'
    }
  }
}
