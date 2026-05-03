-- Migration 008: seller_payment_methods on orders
-- Stores the payment methods the seller wants to use for this specific order.
-- Snapshotted at order creation so buyers see what was advertised, not a later edit.
-- Private: excluded from public order listing; only revealed to the matched buyer.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS seller_payment_methods jsonb;
