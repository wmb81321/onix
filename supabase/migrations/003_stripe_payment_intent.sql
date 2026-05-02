-- Add stripe_payment_intent_id to trades (used by PaymentElement flow)
alter table trades
  add column if not exists stripe_payment_intent_id text;
