-- ============================================================================
-- REMOVE OLD METADATA-BASED TRIGGERS AND FUNCTIONS
-- ============================================================================
-- This script removes the old triggers that check for company_id in metadata
-- Since we're now using owner_id column, these are no longer needed
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop triggers that enforce metadata-based validation
-- ============================================================================

-- Drop trigger on companies table that enforces partner ownership via metadata
DROP TRIGGER IF EXISTS enforce_partner_company_ownership_trg ON public.companies;
DROP TRIGGER IF EXISTS sync_company_id_to_user_metadata_trg ON public.companies;
DROP TRIGGER IF EXISTS assign_partner_role_on_company_ownership_trg ON public.companies;

-- Check auth.users table too (in case triggers are there)
DROP TRIGGER IF EXISTS enforce_partner_company_ownership_trg ON auth.users;
DROP TRIGGER IF EXISTS sync_company_id_to_user_metadata_trg ON auth.users;
DROP TRIGGER IF EXISTS assign_partner_role_on_company_ownership_trg ON auth.users;

-- ============================================================================
-- STEP 2: Drop the trigger functions (after triggers are removed)
-- ============================================================================

DROP FUNCTION IF EXISTS public.enforce_partner_company_ownership() CASCADE;
DROP FUNCTION IF EXISTS public.sync_company_id_to_user_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.assign_partner_role_on_company_ownership() CASCADE;

-- ============================================================================
-- STEP 3: Keep current_user_company_id if it's useful, but update it
-- ============================================================================
-- This function should return company_id based on owner_id, not metadata

CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Return the company_id for the current authenticated user
  -- Based on owner_id column, NOT metadata
  SELECT id 
  FROM public.companies 
  WHERE owner_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- STEP 4: Verification - List remaining triggers on companies table
-- ============================================================================
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'companies'
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ OLD TRIGGERS REMOVED';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 Remaining triggers on companies table: %', trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT WAS REMOVED:';
  RAISE NOTICE '❌ enforce_partner_company_ownership (checked metadata)';
  RAISE NOTICE '❌ sync_company_id_to_user_metadata (synced to metadata)';
  RAISE NOTICE '❌ assign_partner_role_on_company_ownership (role assignment)';
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT REMAINS:';
  RAISE NOTICE '✅ current_user_company_id() now uses owner_id';
  RAISE NOTICE '✅ RLS policies use owner_id (from previous migration)';
  RAISE NOTICE '✅ companies.owner_id column is the source of truth';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Logout and login again';
  RAISE NOTICE '2. Try creating/viewing company data';
  RAISE NOTICE '3. Should work without metadata errors';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after script completes)
-- ============================================================================

-- Check remaining triggers on companies table
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
ORDER BY t.tgname;

-- Test the updated function
SELECT 
  'Testing current_user_company_id()' as test,
  public.current_user_company_id() as your_company_id;

-- Verify your company exists with owner_id set
SELECT 
  id as company_id,
  name,
  owner_id,
  CASE 
    WHEN owner_id = auth.uid() THEN '✅ YOU OWN THIS'
    WHEN owner_id IS NULL THEN '⚠️ NO OWNER SET'
    ELSE '❌ OWNED BY SOMEONE ELSE'
  END as ownership_status
FROM public.companies
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If you still get errors after running this:
-- 1. Logout and login (clear session)
-- 2. Check browser console for new errors
-- 3. Run verification queries above
-- 4. Share any remaining error messages
-- ============================================================================
