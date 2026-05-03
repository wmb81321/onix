-- 007_order_deposit_address.sql
-- Move virtual deposit address attribution from per-trade to per-order.
-- Order creator pays 0.1 USDC x402 service fee at order creation; VA is derived from order_id.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS virtual_deposit_address text UNIQUE,
  ADD COLUMN IF NOT EXISTS service_fee_paid_at     timestamptz,
  ADD COLUMN IF NOT EXISTS service_fee_tx_hash     text;

-- Expire all legacy open orders that have no deposit address so they cannot be matched
-- under the new flow (they were created without paying the service fee).
UPDATE orders
  SET status = 'expired'
  WHERE status = 'open'
    AND virtual_deposit_address IS NULL;

CREATE INDEX IF NOT EXISTS orders_virtual_deposit_address_idx
  ON orders (virtual_deposit_address);
