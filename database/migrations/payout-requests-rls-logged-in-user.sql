-- ============================================================================
-- PAYOUT_REQUESTS RLS: LOGGED-IN USER ONLY
-- ============================================================================
-- Ensures payout_requests only shows rows where user_id matches the
-- logged-in profile (auth.uid()). Run this if users see no rows or wrong rows.
-- ============================================================================

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: only rows where user_id = logged-in user (auth.uid())
DROP POLICY IF EXISTS "payout_requests_select_own" ON public.payout_requests;
CREATE POLICY "payout_requests_select_own"
  ON public.payout_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- INSERT: only allow inserting with user_id = logged-in user
DROP POLICY IF EXISTS "payout_requests_insert_own" ON public.payout_requests;
CREATE POLICY "payout_requests_insert_own"
  ON public.payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Ensure no other SELECT/INSERT policies allow cross-user access
-- (UPDATE/DELETE not granted to authenticated so users cannot change others' rows)

COMMENT ON TABLE public.payout_requests IS 'Payout requests; RLS restricts to rows where user_id = auth.uid() (logged-in user).';
