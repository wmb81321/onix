-- Migration 009: add 'cancelled' and 'refunding' to trade_status enum
-- 'cancelled'  — trade cancelled before any deposit (no USDC refund needed)
-- 'refunding'  — transitional: USDC refund in-flight to seller (prevents double-refund)

ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'refunding';
