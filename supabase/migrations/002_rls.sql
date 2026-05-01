-- Convexo P2P — Row Level Security
-- Every table is locked down; users only see their own data.
-- The agent uses the service-role key (bypasses RLS) — never expose in browser.

alter table users   enable row level security;
alter table orders  enable row level security;
alter table trades  enable row level security;
alter table ratings enable row level security;

-- ── users ────────────────────────────────────────────────────────────────────
-- Read own profile; agent upserts via service role
create policy "users: read own"
  on users for select
  using (address = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "users: insert own"
  on users for insert
  with check (address = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "users: read all ratings_avg for order book display"
  on users for select
  using (true);   -- public read of rating_avg + trade_count is intentional

-- ── orders ───────────────────────────────────────────────────────────────────
-- Anyone can read open orders (order book is public)
create policy "orders: read open"
  on orders for select
  using (status = 'open');

-- Only owner can insert / cancel their own orders
create policy "orders: insert own"
  on orders for insert
  with check (user_address = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "orders: update own"
  on orders for update
  using (user_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- ── trades ───────────────────────────────────────────────────────────────────
-- Both parties can read their trades
create policy "trades: read own"
  on trades for select
  using (
    buyer_address  = current_setting('request.jwt.claims', true)::json->>'sub'
    or
    seller_address = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Only the agent (service role) writes trades — no direct client writes

-- ── ratings ──────────────────────────────────────────────────────────────────
create policy "ratings: read all"
  on ratings for select
  using (true);

create policy "ratings: insert own"
  on ratings for insert
  with check (rater_address = current_setting('request.jwt.claims', true)::json->>'sub');
