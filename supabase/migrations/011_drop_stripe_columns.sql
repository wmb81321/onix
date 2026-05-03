-- Migration 011: drop legacy Stripe / Stripe Link columns
-- These were added in migrations 003–005 for the v1.x Stripe flow, which was
-- removed in v2.0.0. They have not been written by any code since then.
-- Safe to drop because no v2.0+ code path reads or writes them.

ALTER TABLE users
  DROP COLUMN IF EXISTS stripe_account,
  DROP COLUMN IF EXISTS link_payment_method_id,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_buyer_pm_id,
  DROP COLUMN IF EXISTS stripe_buyer_card_brand,
  DROP COLUMN IF EXISTS stripe_buyer_card_last4;

ALTER TABLE trades
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS link_spend_request_id,
  DROP COLUMN IF EXISTS stripe_payout_id,
  DROP COLUMN IF EXISTS stripe_account_id;
