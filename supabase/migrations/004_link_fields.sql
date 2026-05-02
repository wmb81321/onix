-- Phase 6: Stripe Link SPT payment fields
alter table trades add column if not exists link_spend_request_id text;
alter table users  add column if not exists link_payment_method_id text;
