-- ============================================================================
-- FIX: extras Table RLS Permissions
-- ============================================================================
-- 
-- This script fixes the RLS policies for the extras table.
-- The issue: Policies are using user_profiles which may not exist or work correctly.
-- The fix: Use companies.owner_id = auth.uid() pattern (same as cars, locations, etc.)
--
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Grant permissions to authenticated users
GRANT ALL ON public.extras TO authenticated;
GRANT ALL ON public.extras TO anon; -- Also grant to anon for compatibility

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "extras_select_company" ON public.extras;
DROP POLICY IF EXISTS "extras_insert_company" ON public.extras;
DROP POLICY IF EXISTS "extras_update_company" ON public.extras;
DROP POLICY IF EXISTS "extras_delete_company" ON public.extras;
DROP POLICY IF EXISTS "extras_select_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_insert_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_update_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_delete_policy" ON public.extras;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================
-- Users can SELECT extras from their company
CREATE POLICY "extras_select_policy" ON public.extras
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.companies
      WHERE companies.id = extras.company_id
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- INSERT POLICY (THE CRITICAL ONE - This is what was blocking you)
-- ============================================================================
-- Users can INSERT extras for their company
CREATE POLICY "extras_insert_policy" ON public.extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.companies
      WHERE companies.id = extras.company_id
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================
-- Users can UPDATE extras from their company
CREATE POLICY "extras_update_policy" ON public.extras
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.companies
      WHERE companies.id = extras.company_id
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.companies
      WHERE companies.id = extras.company_id
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- DELETE POLICY
-- ============================================================================
-- Users can DELETE extras from their company
CREATE POLICY "extras_delete_policy" ON public.extras
  FOR DELETE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.companies
      WHERE companies.id = extras.company_id
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check policies exist
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'extras'
ORDER BY cmd;
-- Should show 4 policies, all with 'authenticated, anon' roles

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'extras';
-- Expected: rowsecurity = true

-- Test INSERT (replace with your actual company_id)
-- INSERT INTO public.extras (company_id, name, default_price, unit)
-- VALUES ('YOUR_COMPANY_ID', 'Test Extra', 10.00, 'per_day');
-- Should work without permission errors

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- 
-- If you still get permission errors:
-- 
-- 1. Verify the user is authenticated:
--    SELECT auth.uid();
--    Should return your user ID
--
-- 2. Verify you own the company:
--    SELECT id, owner_id, auth.uid()
--    FROM companies
--    WHERE id = 'YOUR_COMPANY_ID';
--    Should show owner_id matches auth.uid()
--
-- 3. Check if policies are being applied:
--    EXPLAIN (ANALYZE, BUFFERS)
--    INSERT INTO extras (company_id, name, default_price, unit)
--    VALUES ('YOUR_COMPANY_ID', 'Test', 10.00, 'per_day');
--    Look for "Filter" in the plan showing the policy check
--
-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Key changes:
-- 1. Removed dependency on user_profiles table
-- 2. Uses companies.owner_id = auth.uid() pattern (same as other tables)
-- 3. Grants permissions to both authenticated AND anon (for compatibility)
-- 4. All policies check company ownership via owner_id
--
-- Security:
-- - Only authenticated users can access extras
-- - Users can only access extras from companies they own
-- - All operations are company-scoped
--
-- ============================================================================
