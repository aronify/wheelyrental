-- ============================================================================
-- USER BALANCE & PAYOUT CONTROL SYSTEM
-- ============================================================================
--
-- Data model:
--   user_balance: per-user available_balance and pending_payout_amount (>= 0)
--   payout_requests: existing table; status enum includes 'paid'
--
-- Business rules enforced in DB:
--   - A user cannot request a payout greater than available_balance
--   - Balance updates are atomic (transaction-level lock)
--   - Negative balances are never allowed (CHECK constraints)
--
-- Run this migration in Supabase SQL Editor after payout_requests exists.
-- ============================================================================

-- Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. user_balance table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_payout_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (pending_payout_amount >= 0),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_balance IS 'Per-user balance: available funds and amount pending in payout requests.';
COMMENT ON COLUMN public.user_balance.available_balance IS 'Funds available for payout; must be >= 0.';
COMMENT ON COLUMN public.user_balance.pending_payout_amount IS 'Sum of amounts in payout_requests with status pending (and optionally approved).';

CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON public.user_balance(user_id);

-- Trigger: keep last_updated_at in sync
CREATE OR REPLACE FUNCTION public.update_user_balance_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_user_balance_last_updated ON public.user_balance;
CREATE TRIGGER trigger_user_balance_last_updated
  BEFORE UPDATE ON public.user_balance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_balance_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Add 'paid' to payout_requests.status if not already present
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  conname TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payout_requests'
  ) THEN
    -- Find the check constraint on status (may be auto-named)
    SELECT c.conname INTO conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'payout_requests'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
    LIMIT 1;
    IF conname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.payout_requests DROP CONSTRAINT %I', conname);
    END IF;
    ALTER TABLE public.payout_requests
      ADD CONSTRAINT payout_requests_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'confirmed', 'paid'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- constraint already exists with same definition
END
$$;

-- ----------------------------------------------------------------------------
-- 3. RLS for user_balance
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_balance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_balance_select_own" ON public.user_balance;
CREATE POLICY "user_balance_select_own"
  ON public.user_balance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only the atomic function should UPDATE user_balance; users do not get direct UPDATE
DROP POLICY IF EXISTS "user_balance_update_own" ON public.user_balance;
-- No INSERT/UPDATE policy for authenticated: updates happen via create_payout_from_balance only.
-- Allow service role / backend to insert initial row (e.g. when crediting balance)
CREATE POLICY "user_balance_insert_own"
  ON public.user_balance
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Get or create user balance (for display; creates row with 0 if missing)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_user_balance(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  available_balance NUMERIC(12, 2),
  pending_payout_amount NUMERIC(12, 2),
  last_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only access own balance';
  END IF;
  RETURN QUERY
  INSERT INTO public.user_balance (user_id, available_balance, pending_payout_amount)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO UPDATE SET last_updated_at = public.user_balance.last_updated_at
  RETURNING
    public.user_balance.user_id,
    public.user_balance.available_balance,
    public.user_balance.pending_payout_amount,
    public.user_balance.last_updated_at;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Atomic: create payout request and deduct balance (transaction-level lock)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_payout_from_balance(
  p_user_id UUID,
  p_requested_amount NUMERIC(12, 2),
  p_invoice_url TEXT DEFAULT '',
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_id UUID;
  v_available NUMERIC(12, 2);
  v_payout_id UUID;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only create payout for yourself';
  END IF;
  IF p_requested_amount IS NULL OR p_requested_amount <= 0 THEN
    RAISE EXCEPTION 'Requested amount must be greater than 0';
  END IF;

  -- Lock the user_balance row (or create it with 0 if missing)
  INSERT INTO public.user_balance (user_id, available_balance, pending_payout_amount)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT ub.user_id, ub.available_balance INTO v_balance_id, v_available
  FROM public.user_balance ub
  WHERE ub.user_id = p_user_id
  FOR UPDATE;

  IF v_balance_id IS NULL THEN
    RAISE EXCEPTION 'Balance record not found';
  END IF;
  IF v_available < p_requested_amount THEN
    RAISE EXCEPTION 'Payout exceeds available balance';
  END IF;

  -- Insert payout_requests (invoice_url required by schema: use placeholder if empty)
  INSERT INTO public.payout_requests (
    user_id,
    invoice_url,
    amount,
    description,
    status
  )
  VALUES (
    p_user_id,
    COALESCE(NULLIF(TRIM(p_invoice_url), ''), 'balance-payout'),
    p_requested_amount,
    p_description,
    'pending'
  )
  RETURNING id INTO v_payout_id;

  -- Deduct from available_balance and add to pending_payout_amount
  UPDATE public.user_balance
  SET
    available_balance = available_balance - p_requested_amount,
    pending_payout_amount = pending_payout_amount + p_requested_amount,
    last_updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_payout_id;
END;
$$;

COMMENT ON FUNCTION public.create_payout_from_balance IS 'Atomically creates a payout request and deducts from user balance. Caller must be authenticated as p_user_id.';

-- ----------------------------------------------------------------------------
-- 6. Grants
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT ON public.user_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payout_from_balance(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- Note: When a payout_requests row status changes to 'rejected', the app or
-- a trigger should add requested amount back to available_balance and subtract
-- from pending_payout_amount. When status changes to 'paid', subtract from
-- pending_payout_amount only. Use transaction-level locking when updating.
-- ----------------------------------------------------------------------------
