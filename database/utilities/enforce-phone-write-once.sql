-- ============================================================================
-- STEP A: ENFORCE PHONE NUMBER WRITE-ONCE PROTECTION
-- ============================================================================
-- Prevents updating companies.phone once it has been set (NOT NULL)
-- Phone can be NULL initially, but once set, it cannot be changed
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS companies_phone_write_once_trg ON public.companies;

-- Create trigger function to enforce phone write-once
-- Allows admin updates via session variable 'allow_phone_update'
CREATE OR REPLACE FUNCTION public.enforce_phone_write_once()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: Allow phone to be set (no restriction)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- On UPDATE: Check if admin update is allowed
  IF TG_OP = 'UPDATE' THEN
    -- Allow update if admin session variable is set (for admin dashboard/backdoor)
    IF current_setting('app.allow_phone_update', true) = 'true' THEN
      RETURN NEW; -- Admin update allowed
    END IF;
    
    -- If OLD phone is NOT NULL and NEW phone is different, raise error
    IF OLD.phone IS NOT NULL AND OLD.phone IS DISTINCT FROM NEW.phone THEN
      RAISE EXCEPTION 'Phone number cannot be changed once set. Current phone: %. Use admin function to update.', OLD.phone
        USING ERRCODE = '23505'; -- unique_violation-like error
    END IF;
    
    -- If OLD phone is NULL, allow setting it (first time)
    -- If OLD phone equals NEW phone, allow (no change)
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER companies_phone_write_once_trg
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_phone_write_once();

-- Verify trigger creation
SELECT 
  'Phone write-once trigger created' as status,
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'public.companies'::regclass
  AND tgname = 'companies_phone_write_once_trg';

