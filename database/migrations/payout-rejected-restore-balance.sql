-- ============================================================================
-- PAYOUT REJECTED → RESTORE BALANCE
-- ============================================================================
-- When a payout_requests row status changes to 'rejected', add the amount back
-- to available_balance and subtract from pending_payout_amount (atomic).
-- Restores to companies table (by company_id or by owner_id). Optionally
-- restores to user_balance if that table exists (legacy).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_balance_on_payout_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(12, 2);
  v_company_id UUID;
BEGIN
  IF NEW.status <> 'rejected' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  v_amount := COALESCE(NEW.amount, 0);
  IF v_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Restore to companies table (company-based balance)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payout_requests' AND column_name = 'company_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'available_balance') THEN
    v_company_id := NEW.company_id;
    IF v_company_id IS NULL THEN
      SELECT id INTO v_company_id FROM public.companies WHERE owner_id = NEW.user_id LIMIT 1;
    END IF;
    IF v_company_id IS NOT NULL THEN
      UPDATE public.companies
      SET
        available_balance = available_balance + v_amount,
        pending_payout_amount = GREATEST(0, pending_payout_amount - v_amount)
      WHERE id = v_company_id;
    END IF;
  END IF;

  -- Legacy: restore to user_balance if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_balance') THEN
    UPDATE public.user_balance
    SET
      available_balance = available_balance + v_amount,
      pending_payout_amount = GREATEST(0, pending_payout_amount - v_amount),
      last_updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payout_requests') THEN
    DROP TRIGGER IF EXISTS trigger_restore_balance_on_payout_rejected ON public.payout_requests;
    CREATE TRIGGER trigger_restore_balance_on_payout_rejected
      AFTER UPDATE OF status ON public.payout_requests
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM 'rejected' AND NEW.status = 'rejected')
      EXECUTE FUNCTION public.restore_balance_on_payout_rejected();
    RAISE NOTICE 'Applied trigger: restore balance on payout rejected.';
  ELSE
    RAISE NOTICE 'Skipped: payout_requests missing.';
  END IF;
END $$;
