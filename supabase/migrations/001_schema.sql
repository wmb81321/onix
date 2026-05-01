-- Convexo P2P — core schema
-- Run: supabase db push

create extension if not exists "uuid-ossp";

-- ── users ────────────────────────────────────────────────────────────────────
-- Keyed by Tempo wallet address (lowercase hex). Created on first connect.
create table if not exists users (
  address        text primary key,          -- 0x… Tempo wallet address
  stripe_account text,                      -- Stripe Connect account ID (nullable until onboarded)
  rating_avg     numeric(3,2) default 0,    -- cached average, recomputed after each trade
  trade_count    integer      default 0,
  created_at     timestamptz  default now()
);

-- ── orders ───────────────────────────────────────────────────────────────────
create type order_type   as enum ('buy', 'sell');
create type order_status as enum ('open', 'matched', 'cancelled', 'expired');

create table if not exists orders (
  id           uuid         primary key default uuid_generate_v4(),
  user_address text         not null references users(address),
  type         order_type   not null,
  usdc_amount  numeric(18,6) not null check (usdc_amount > 0),
  usd_amount   numeric(18,2) not null check (usd_amount  > 0),
  rate         numeric(10,6) not null,         -- usd_amount / usdc_amount
  status       order_status  not null default 'open',
  expires_at   timestamptz   not null default (now() + interval '24 hours'),
  created_at   timestamptz   not null default now()
);

create index on orders (status, created_at desc);
create index on orders (user_address, status);

-- ── trades ───────────────────────────────────────────────────────────────────
create type trade_status as enum (
  'created',
  'deposited',      -- USDC arrived at virtual address
  'fee_paid',       -- 0.1 USDC MPP service fee received
  'fiat_sent',      -- Stripe payout initiated
  'released',       -- USDC sent to buyer
  'complete',       -- both parties rated
  'deposit_timeout',
  'stripe_failed',
  'refunded'
);

create table if not exists trades (
  id                      uuid         primary key default uuid_generate_v4(),
  order_id                uuid         not null references orders(id),
  buyer_address           text         not null references users(address),
  seller_address          text         not null references users(address),
  usdc_amount             numeric(18,6) not null,
  usd_amount              numeric(18,2) not null,
  -- Virtual address derived off-chain: VirtualAddress.from({ masterId, userTag: id })
  virtual_deposit_address text         not null unique,
  -- Stripe fields (populated during fiat leg)
  stripe_payout_id        text,
  stripe_account_id       text,        -- Seller's Stripe Connect account
  -- State
  status                  trade_status not null default 'created',
  deposit_deadline        timestamptz  not null default (now() + interval '30 minutes'),
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now()
);

create index on trades (buyer_address,  status);
create index on trades (seller_address, status);
create index on trades (status, deposit_deadline);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trades_updated_at
  before update on trades
  for each row execute function update_updated_at();

-- ── ratings ───────────────────────────────────────────────────────────────────
create table if not exists ratings (
  id             uuid        primary key default uuid_generate_v4(),
  trade_id       uuid        not null references trades(id),
  rater_address  text        not null references users(address),
  ratee_address  text        not null references users(address),
  score          smallint    not null check (score between 1 and 5),
  comment        text,
  created_at     timestamptz not null default now(),
  unique (trade_id, rater_address)   -- one rating per party per trade
);

-- Recompute cached avg on the users table after each rating insert
create or replace function refresh_user_rating()
returns trigger language plpgsql as $$
begin
  update users
  set rating_avg  = sub.avg,
      trade_count = sub.cnt
  from (
    select ratee_address,
           round(avg(score)::numeric, 2) as avg,
           count(*)                      as cnt
    from ratings
    where ratee_address = new.ratee_address
    group by ratee_address
  ) sub
  where address = sub.ratee_address;
  return new;
end;
$$;

create trigger ratings_refresh_user
  after insert on ratings
  for each row execute function refresh_user_rating();
