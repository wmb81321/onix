import { z } from 'zod'

// ── Trade ────────────────────────────────────────────────────────────────────

export const TradeStatusSchema = z.enum([
  'created',
  'deposited',
  'payment_sent',
  'payment_confirmed',
  'released',
  'complete',
  'deposit_timeout',
  'disputed',
  'refunded',
  // Legacy statuses (old Stripe flow — kept for backward compat with existing rows)
  'fee_paid',
  'fiat_sent',
  'stripe_failed',
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
  status:                  TradeStatusSchema,
  deposit_deadline:        z.string(),
  // Payment fields (migration 006)
  payment_method:       z.string().nullable(),
  payment_reference:    z.string().nullable(),
  payment_proof_url:    z.string().nullable(),
  payment_sent_at:      z.string().nullable(),
  payment_confirmed_at: z.string().nullable(),
  created_at:           z.string(),
  updated_at:           z.string(),
}).passthrough()
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
  // Migration 007 — per-order virtual deposit address + fee receipt
  virtual_deposit_address: z.string().nullable().optional(),
  service_fee_paid_at:     z.string().nullable().optional(),
  service_fee_tx_hash:     z.string().nullable().optional(),
}).passthrough()
export type OrderRow = z.infer<typeof OrderRowSchema>

// ── User ─────────────────────────────────────────────────────────────────────

const PaymentMethodSchema = z.object({
  type:  z.string(),
  label: z.string(),
  value: z.string(),
})
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const UserRowSchema = z.object({
  address:         z.string(),
  rating_avg:      numericField,
  trade_count:     z.number().int(),
  payment_methods: z.array(PaymentMethodSchema).default([]),
  created_at:      z.string(),
}).passthrough()
export type UserRow = z.infer<typeof UserRowSchema>
