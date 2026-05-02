import { z } from 'zod'

// ── Trade ────────────────────────────────────────────────────────────────────

export const TradeStatusSchema = z.enum([
  'created',
  'deposited',
  'fee_paid',
  'fiat_sent',
  'released',
  'complete',
  'deposit_timeout',
  'stripe_failed',
  'refunded',
])
export type TradeStatus = z.infer<typeof TradeStatusSchema>

// Supabase returns numeric columns as strings for high-precision types
const numericField = z.coerce.number()

export const TradeRowSchema = z.object({
  id:                      z.string().uuid(),
  order_id:                z.string().uuid(),
  buyer_address:           z.string(),
  seller_address:          z.string(),
  usdc_amount:             numericField,
  usd_amount:              numericField,
  virtual_deposit_address: z.string(),
  stripe_payout_id:          z.string().nullable(),
  stripe_account_id:         z.string().nullable(),
  stripe_payment_intent_id:  z.string().nullable(),
  link_spend_request_id:     z.string().nullable(),
  status:                    TradeStatusSchema,
  deposit_deadline:        z.string(),  // ISO 8601
  created_at:              z.string(),
  updated_at:              z.string(),
})
export type TradeRow = z.infer<typeof TradeRowSchema>

// ── Order ────────────────────────────────────────────────────────────────────

export const OrderStatusSchema = z.enum(['open', 'matched', 'cancelled', 'expired'])
export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const OrderTypeSchema = z.enum(['buy', 'sell'])
export type OrderType = z.infer<typeof OrderTypeSchema>

export const OrderRowSchema = z.object({
  id:           z.string().uuid(),
  user_address: z.string(),
  type:         OrderTypeSchema,
  usdc_amount:  numericField,
  usd_amount:   numericField,
  rate:         numericField,
  status:       OrderStatusSchema,
  expires_at:   z.string(),
  created_at:   z.string(),
})
export type OrderRow = z.infer<typeof OrderRowSchema>

// ── User ─────────────────────────────────────────────────────────────────────

export const UserRowSchema = z.object({
  address:        z.string(),
  stripe_account: z.string().nullable(),
  rating_avg:     numericField,
  trade_count:    z.number().int(),
  created_at:     z.string(),
  // Migration 004
  link_payment_method_id: z.string().nullable(),
  // Migration 005
  stripe_customer_id:       z.string().nullable(),
  stripe_buyer_pm_id:       z.string().nullable(),
  stripe_buyer_card_brand:  z.string().nullable(),
  stripe_buyer_card_last4:  z.string().nullable(),
})
export type UserRow = z.infer<typeof UserRowSchema>
