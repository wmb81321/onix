-- 006_manual_payment.sql
-- Remove Stripe as payment rail. Counterparties pay each other directly.
-- Seller confirms receipt; agent releases USDC on confirmation.

-- New trade statuses
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'payment_sent';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'payment_confirmed';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'disputed';

-- Payment tracking columns on trades
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS payment_method       text,
  ADD COLUMN IF NOT EXISTS payment_reference    text,
  ADD COLUMN IF NOT EXISTS payment_proof_url    text,
  ADD COLUMN IF NOT EXISTS payment_sent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

-- Per-user payment methods: [{ type, label, value }]
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb;
