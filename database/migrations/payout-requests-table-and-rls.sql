-- ============================================================================
-- PAYOUT_REQUESTS: FULL TABLE + RLS
-- ============================================================================
-- Table for payout requests. invoice_url stores the path in the storage
-- bucket 'invoices' (e.g. user_id/filename.pdf). RLS ensures users see only
-- their own requests; the app accesses via authenticated user.
--
-- Run after companies table exists (optional company_id). Run invoices bucket
-- policies (storage) separately if needed.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_url TEXT NOT NULL,
  amount NUMERIC(12, 2) CHECK (amount IS NULL OR amount >= 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'processed', 'confirmed', 'paid')
  ),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payout_requests')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payout_requests' AND column_name = 'company_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    ALTER TABLE public.payout_requests ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_payout_requests_company_id ON public.payout_requests(company_id);
  END IF;
END $$;

COMMENT ON TABLE public.payout_requests IS 'Payout requests; invoice_url is path in storage bucket invoices.';
COMMENT ON COLUMN public.payout_requests.invoice_url IS 'Path in storage bucket invoices (e.g. user_id/invoice.pdf).';
COMMENT ON COLUMN public.payout_requests.status IS 'pending, approved, rejected, processed, confirmed, paid';

CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON public.payout_requests(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_payout_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_payout_requests_updated_at ON public.payout_requests;
CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_payout_requests_updated_at();

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_requests_select_own" ON public.payout_requests;
CREATE POLICY "payout_requests_select_own"
  ON public.payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payout_requests_insert_own" ON public.payout_requests;
CREATE POLICY "payout_requests_insert_own"
  ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table-level privileges (required; otherwise "permission denied for table payout_requests")
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;

-- Users cannot UPDATE or DELETE after submit (admin/backend can via service role or separate policy)
-- To allow users to cancel own pending only, add:
-- CREATE POLICY "payout_requests_update_own_pending" ON public.payout_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending');
