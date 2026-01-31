-- ============================================================================
-- BOOKING RETURNED → CREDIT COMPANY BALANCE (IDEMPOTENT)
-- ============================================================================
-- When a booking status changes to 'returned' (dropped off), add the booking
-- total_price to that company's available_balance once (idempotent).
--
-- Prerequisites: bookings.company_id, companies.available_balance.
-- ============================================================================

-- Ledger: one credit per booking so we never double-credit
CREATE TABLE IF NOT EXISTS public.booking_company_balance_credits (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.booking_company_balance_credits IS 'Idempotent: each returned booking credits company balance once.';

CREATE INDEX IF NOT EXISTS idx_booking_company_balance_credits_company_id ON public.booking_company_balance_credits(company_id);

ALTER TABLE public.booking_company_balance_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_company_credits_select_company" ON public.booking_company_balance_credits;
CREATE POLICY "booking_company_credits_select_company"
  ON public.booking_company_balance_credits FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  );

-- Function: credit company balance when booking becomes returned
CREATE OR REPLACE FUNCTION public.credit_company_balance_on_booking_returned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_total NUMERIC(12, 2);
BEGIN
  IF NEW.status <> 'returned' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'returned' THEN
    RETURN NEW;
  END IF;

  v_total := COALESCE(NEW.total_price, 0);
  IF v_total <= 0 THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'company_id') THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'available_balance') THEN
    RETURN NEW;
  END IF;

  v_company_id := NEW.company_id;
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.booking_company_balance_credits WHERE booking_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  UPDATE public.companies
  SET
    available_balance = available_balance + v_total,
    updated_at = NOW()
  WHERE id = v_company_id;

  INSERT INTO public.booking_company_balance_credits (booking_id, company_id, amount)
  VALUES (NEW.id, v_company_id, v_total)
  ON CONFLICT (booking_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'company_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'available_balance') THEN
    DROP TRIGGER IF EXISTS trigger_credit_company_balance_on_booking_returned ON public.bookings;
    CREATE TRIGGER trigger_credit_company_balance_on_booking_returned
      AFTER UPDATE OF status ON public.bookings
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM 'returned' AND NEW.status = 'returned')
      EXECUTE FUNCTION public.credit_company_balance_on_booking_returned();
    RAISE NOTICE 'Applied trigger: credit company balance on booking returned.';
  ELSE
    RAISE NOTICE 'Skipped: bookings.company_id or companies.available_balance missing.';
  END IF;
END $$;

GRANT SELECT ON public.booking_company_balance_credits TO authenticated;
