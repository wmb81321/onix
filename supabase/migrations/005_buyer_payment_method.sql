alter table users
  add column if not exists stripe_customer_id    text,
  add column if not exists stripe_buyer_pm_id    text,
  add column if not exists stripe_buyer_card_brand text,
  add column if not exists stripe_buyer_card_last4 text;
