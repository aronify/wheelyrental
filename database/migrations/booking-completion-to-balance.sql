-- ============================================================================
-- BOOKING COMPLETION → PARTNER BALANCE (IDEMPOTENT)
-- ============================================================================
-- Only COMPLETED (returned) bookings affect partner balance. When booking
-- status changes to 'returned', add booking total to partner's available_balance
-- once (idempotent). Partner = companies.owner_id for booking.company_id.
--
-- Prerequisites: bookings.company_id, companies.owner_id, user_balance table.
-- Run after user-balance-and-payout-control.sql.
-- ============================================================================

-- Ledger: one credit per booking (idempotent)
CREATE TABLE IF NOT EXISTS public.booking_balance_credits (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.booking_balance_credits IS 'Idempotent record: each returned booking credits partner balance once.';

CREATE INDEX IF NOT EXISTS idx_booking_balance_credits_user_id ON public.booking_balance_credits(user_id);

-- Only backend/trigger updates user_balance; no direct UPDATE policy for users
ALTER TABLE public.booking_balance_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking_balance_credits_select_own" ON public.booking_balance_credits;
CREATE POLICY "booking_balance_credits_select_own"
  ON public.booking_balance_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Function: credit partner balance when booking becomes returned (idempotent)
CREATE OR REPLACE FUNCTION public.credit_balance_on_booking_returned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
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

  -- Resolve partner: booking.company_id → companies.owner_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'company_id') THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'owner_id') THEN
    RETURN NEW;
  END IF;

  SELECT c.owner_id INTO v_owner_id
  FROM public.companies c
  WHERE c.id = NEW.company_id
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Idempotent: skip if already credited
  IF EXISTS (SELECT 1 FROM public.booking_balance_credits WHERE booking_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Ensure user_balance row exists
  INSERT INTO public.user_balance (user_id, available_balance, pending_payout_amount)
  VALUES (v_owner_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Credit balance
  UPDATE public.user_balance
  SET
    available_balance = available_balance + v_total,
    last_updated_at = NOW()
  WHERE user_id = v_owner_id;

  -- Record credit (idempotent)
  INSERT INTO public.booking_balance_credits (booking_id, user_id, amount)
  VALUES (NEW.id, v_owner_id, v_total)
  ON CONFLICT (booking_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'company_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'owner_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_balance') THEN
    DROP TRIGGER IF EXISTS trigger_credit_balance_on_booking_returned ON public.bookings;
    CREATE TRIGGER trigger_credit_balance_on_booking_returned
      AFTER UPDATE OF status ON public.bookings
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM 'returned' AND NEW.status = 'returned')
      EXECUTE FUNCTION public.credit_balance_on_booking_returned();
    RAISE NOTICE 'Applied trigger: credit balance on booking returned.';
  ELSE
    RAISE NOTICE 'Skipped trigger: bookings.company_id, companies.owner_id, or user_balance missing.';
  END IF;
END $$;

GRANT SELECT ON public.booking_balance_credits TO authenticated;
