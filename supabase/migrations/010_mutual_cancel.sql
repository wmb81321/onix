-- Migration 010: mutual cancellation support
-- cancel_requested  — one party has requested cancel; waiting for the other to confirm or reject
-- cancel_requested_by         — address of the party who initiated the cancel request
-- cancel_requested_from_status — the status the trade was in before moving to cancel_requested
--                                used to determine whether a USDC refund is needed on confirm,
--                                and to restore status if the request is rejected

ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'cancel_requested';

ALTER TABLE trades ADD COLUMN IF NOT EXISTS cancel_requested_by text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS cancel_requested_from_status text;
