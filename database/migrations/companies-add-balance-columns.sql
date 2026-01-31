-- ============================================================================
-- COMPANIES: ADD BALANCE COLUMNS
-- ============================================================================
-- Adds available_balance and pending_payout_amount to public.companies.
-- Balance is credited when bookings are returned (dropped off); payouts
-- deduct from available_balance.
--
-- Prerequisites: public.companies table exists.
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS pending_payout_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (pending_payout_amount >= 0);

COMMENT ON COLUMN public.companies.available_balance IS 'Funds available for payout; credited when bookings are returned.';
COMMENT ON COLUMN public.companies.pending_payout_amount IS 'Sum of amounts in payout_requests with status pending/approved.';
