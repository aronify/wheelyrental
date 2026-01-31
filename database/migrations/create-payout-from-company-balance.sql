-- ============================================================================
-- CREATE PAYOUT FROM COMPANY BALANCE (RPC)
-- ============================================================================
-- Atomically deducts from companies.available_balance, adds to
-- companies.pending_payout_amount, and inserts a payout_requests row.
-- Use this instead of create_payout_from_balance (user_balance) when
-- balance is stored on companies.
--
-- Prerequisites: companies.available_balance, companies.pending_payout_amount,
-- payout_requests table (optionally with company_id).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_payout_from_company_balance(
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
  v_company_id UUID;
  v_available NUMERIC(12, 2);
  v_pending NUMERIC(12, 2);
  v_payout_id UUID;
BEGIN
  IF p_requested_amount IS NULL OR p_requested_amount <= 0 THEN
    RAISE EXCEPTION 'Requested amount must be greater than 0.';
  END IF;

  -- Find and lock the company owned by this user
  SELECT id, available_balance, pending_payout_amount
    INTO v_company_id, v_available, v_pending
  FROM public.companies
  WHERE owner_id = p_user_id
  FOR UPDATE;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found for this user.';
  END IF;

  IF COALESCE(v_available, 0) < p_requested_amount THEN
    RAISE EXCEPTION 'Requested amount exceeds available balance.';
  END IF;

  -- Deduct from available, add to pending
  UPDATE public.companies
  SET
    available_balance = GREATEST(0, available_balance - p_requested_amount),
    pending_payout_amount = pending_payout_amount + p_requested_amount
  WHERE id = v_company_id;

  -- Insert payout request (with company_id if column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payout_requests' AND column_name = 'company_id'
  ) THEN
    INSERT INTO public.payout_requests (user_id, company_id, invoice_url, amount, description, status)
    VALUES (p_user_id, v_company_id, COALESCE(NULLIF(TRIM(p_invoice_url), ''), 'none'), p_requested_amount, p_description, 'pending')
    RETURNING id INTO v_payout_id;
  ELSE
    INSERT INTO public.payout_requests (user_id, invoice_url, amount, description, status)
    VALUES (p_user_id, COALESCE(NULLIF(TRIM(p_invoice_url), ''), 'none'), p_requested_amount, p_description, 'pending')
    RETURNING id INTO v_payout_id;
  END IF;

  RETURN v_payout_id;
END;
$$;

COMMENT ON FUNCTION public.create_payout_from_company_balance(UUID, NUMERIC, TEXT, TEXT) IS
  'Atomically creates a payout request from company balance. Caller must be authenticated as p_user_id.';

GRANT EXECUTE ON FUNCTION public.create_payout_from_company_balance(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
