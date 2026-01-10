-- ============================================================================
-- REMOVE ALL BLOCKING TRIGGERS - COMPREHENSIVE FIX
-- ============================================================================
-- This removes ALL old triggers that block company creation
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Find and drop ALL triggers on companies table
-- ============================================================================

DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  -- Loop through all triggers on companies table
  FOR trigger_record IN
    SELECT t.tgname as trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'companies'
      AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND NOT t.tgisinternal -- Exclude internal triggers
  LOOP
    -- Drop each trigger
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.companies', trigger_record.trigger_name);
    RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Find and drop ALL related functions
-- ============================================================================

-- Drop functions that enforce metadata or role-based validation
DROP FUNCTION IF EXISTS public.enforce_partner_company_ownership() CASCADE;
DROP FUNCTION IF EXISTS public.sync_company_id_to_user_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.assign_partner_role_on_company_ownership() CASCADE;
DROP FUNCTION IF EXISTS public.validate_partner_role() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_role_change() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_user_role() CASCADE;

-- ============================================================================
-- STEP 3: Check auth.users table for triggers too
-- ============================================================================

DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  -- Loop through all triggers on auth.users table
  FOR trigger_record IN
    SELECT t.tgname as trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'users'
      AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
      AND NOT t.tgisinternal
      AND (
        t.tgname LIKE '%partner%' 
        OR t.tgname LIKE '%company%'
        OR t.tgname LIKE '%role%'
      )
  LOOP
    -- Drop each trigger
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_record.trigger_name);
    RAISE NOTICE 'Dropped auth trigger: %', trigger_record.trigger_name;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: Re-create ONLY the necessary trigger (1:1 company ownership)
-- ============================================================================

-- This is the ONLY trigger we need - prevents multiple companies per user
CREATE OR REPLACE FUNCTION public.prevent_multiple_companies_per_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_company_count INTEGER;
BEGIN
  -- Only check if owner_id is being set/changed
  IF NEW.owner_id IS NOT NULL THEN
    -- On UPDATE: if owner_id is not changing, skip check
    IF TG_OP = 'UPDATE' AND OLD.owner_id IS NOT DISTINCT FROM NEW.owner_id THEN
      RETURN NEW;
    END IF;
    
    -- Check if user already owns a company
    SELECT COUNT(*)
    INTO existing_company_count
    FROM public.companies
    WHERE owner_id = NEW.owner_id
      AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- If user already owns a company, prevent this insert/update
    IF existing_company_count > 0 THEN
      RAISE EXCEPTION 'User already owns a company. One user can only own one company.'
        USING ERRCODE = '23505';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS companies_one_user_one_company_trg ON public.companies;

CREATE TRIGGER companies_one_user_one_company_trg
  BEFORE INSERT OR UPDATE OF owner_id ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_multiple_companies_per_user();

-- ============================================================================
-- STEP 5: Update current_user_company_id function (uses owner_id only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id 
  FROM public.companies 
  WHERE owner_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Count remaining triggers on companies
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'companies'
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT t.tgisinternal;
  
  -- Count problematic functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND (
      p.proname LIKE '%enforce_partner%'
      OR p.proname LIKE '%sync_company%'
      OR p.proname LIKE '%role_change%'
      OR p.proname LIKE '%validate_partner%'
    );
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CLEANUP COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Remaining triggers on companies: %', trigger_count;
  RAISE NOTICE 'Problematic functions: %', function_count;
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT REMAINS:';
  RAISE NOTICE '✅ prevent_multiple_companies_per_user (1:1 enforcement)';
  RAISE NOTICE '✅ current_user_company_id() (uses owner_id)';
  RAISE NOTICE '✅ RLS policies (use owner_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT WAS REMOVED:';
  RAISE NOTICE '❌ All metadata-checking triggers';
  RAISE NOTICE '❌ All role-enforcement triggers';
  RAISE NOTICE '❌ All blocking validation';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Logout and login';
  RAISE NOTICE '2. Go to /profile';
  RAISE NOTICE '3. Fill in company details';
  RAISE NOTICE '4. Save - should work now!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all triggers on companies table
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE 
    WHEN t.tgenabled = 'O' THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'companies'
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- List all custom functions
SELECT 
  n.nspname as schema,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;
