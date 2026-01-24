-- ============================================================================
-- COMPLETE FIX: car_extras RLS Policies
-- ============================================================================
-- 
-- This script completely fixes the RLS policies for car_extras table.
-- It ensures INSERT operations work correctly when adding extras to cars.
--
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Verify table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'car_extras'
  ) THEN
    RAISE EXCEPTION 'Table car_extras does not exist. Please run migration-create-car-extras.sql first.';
  END IF;
  RAISE NOTICE '✅ Table car_extras exists';
END $$;

-- Step 2: Grant permissions (CRITICAL - must be done first)
GRANT ALL ON public.car_extras TO authenticated;
GRANT ALL ON public.car_extras TO anon; -- Also grant to anon for compatibility
DO $$ BEGIN RAISE NOTICE '✅ Permissions granted'; END $$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN RAISE NOTICE '✅ RLS enabled on car_extras'; END $$;

-- Step 4: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "car_extras_select_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_select_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_company" ON public.car_extras;
DO $$ BEGIN RAISE NOTICE '✅ All old policies dropped'; END $$;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================
-- Users can SELECT car_extras for cars from their company
CREATE POLICY "car_extras_select_policy" ON public.car_extras
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ SELECT policy created'; END $$;

-- ============================================================================
-- INSERT POLICY (THE CRITICAL ONE)
-- ============================================================================
-- Users can INSERT car_extras for cars from their company
-- AND the extra must also belong to their company
-- AND both must be from the SAME company
CREATE POLICY "car_extras_insert_policy" ON public.car_extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.cars
      INNER JOIN public.companies car_company ON car_company.id = cars.company_id
      INNER JOIN public.extras ON extras.id = car_extras.extra_id
      INNER JOIN public.companies extra_company ON extra_company.id = extras.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND extras.company_id IS NOT NULL
        AND car_company.owner_id = auth.uid()
        AND extra_company.owner_id = auth.uid()
        AND cars.company_id = extras.company_id  -- Same company check
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ INSERT policy created'; END $$;

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================
-- Users can UPDATE car_extras for cars from their company
CREATE POLICY "car_extras_update_policy" ON public.car_extras
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ UPDATE policy created'; END $$;

-- ============================================================================
-- DELETE POLICY
-- ============================================================================
-- Users can DELETE car_extras for cars from their company
CREATE POLICY "car_extras_delete_policy" ON public.car_extras
  FOR DELETE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ DELETE policy created'; END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check RLS is enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'car_extras';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on car_extras';
  ELSE
    RAISE WARNING '⚠️ RLS is NOT enabled on car_extras';
  END IF;
END $$;

-- Count policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'car_extras';
  
  IF policy_count = 4 THEN
    RAISE NOTICE '✅ SUCCESS: All 4 policies created correctly';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 4 policies, but found %', policy_count;
  END IF;
END $$;

-- Show all policies
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles",
  CASE 
    WHEN cmd = 'INSERT' THEN 'CRITICAL - Check WITH CHECK clause'
    ELSE 'Check USING clause'
  END as "Note"
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_extras'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ============================================================================
-- DIAGNOSTIC QUERIES (Uncomment to run)
-- ============================================================================

-- Test 1: Check if you can see your cars
-- SELECT c.id, c.make, c.model, c.company_id, co.owner_id, auth.uid() as current_user
-- FROM cars c
-- INNER JOIN companies co ON co.id = c.company_id
-- WHERE co.owner_id = auth.uid();

-- Test 2: Check if you can see your extras
-- SELECT e.id, e.name, e.company_id, co.owner_id, auth.uid() as current_user
-- FROM extras e
-- INNER JOIN companies co ON co.id = e.company_id
-- WHERE co.owner_id = auth.uid();

-- Test 3: Check if car and extra are from same company
-- SELECT 
--   c.id as car_id,
--   c.company_id as car_company_id,
--   e.id as extra_id,
--   e.company_id as extra_company_id,
--   (c.company_id = e.company_id) as same_company
-- FROM cars c
-- CROSS JOIN extras e
-- WHERE c.id = 'YOUR_CAR_ID' AND e.id = 'YOUR_EXTRA_ID';

-- Test 4: Try a test INSERT (replace with your actual IDs)
-- INSERT INTO public.car_extras (car_id, extra_id, price, is_included)
-- VALUES ('YOUR_CAR_ID', 'YOUR_EXTRA_ID', 10.00, false);
-- If this works, the policy is correct!

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================
-- 
-- If INSERT still fails, check:
--
-- 1. **Authentication**: 
--    SELECT auth.uid();
--    Should return your user ID (not null)
--
-- 2. **Car Ownership**:
--    SELECT c.id, c.company_id, co.owner_id, auth.uid()
--    FROM cars c
--    INNER JOIN companies co ON co.id = c.company_id
--    WHERE c.id = 'YOUR_CAR_ID';
--    Must show: owner_id = auth.uid()
--
-- 3. **Extra Ownership**:
--    SELECT e.id, e.company_id, co.owner_id, auth.uid()
--    FROM extras e
--    INNER JOIN companies co ON co.id = e.company_id
--    WHERE e.id = 'YOUR_EXTRA_ID';
--    Must show: owner_id = auth.uid()
--
-- 4. **Same Company Check**:
--    SELECT 
--      (SELECT company_id FROM cars WHERE id = 'YOUR_CAR_ID') as car_company,
--      (SELECT company_id FROM extras WHERE id = 'YOUR_EXTRA_ID') as extra_company;
--    Both must be the same UUID
--
-- 5. **Policy Check**:
--    EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
--    INSERT INTO car_extras (car_id, extra_id, price, is_included)
--    VALUES ('YOUR_CAR_ID', 'YOUR_EXTRA_ID', 10.00, false);
--    Look for "Filter" showing policy checks
--
-- 6. **Check for conflicting policies**:
--    SELECT * FROM pg_policies 
--    WHERE tablename = 'car_extras' AND schemaname = 'public';
--    Should show exactly 4 policies
--
-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Key improvements in this version:
-- 1. ✅ Grants permissions to both authenticated AND anon (for compatibility)
-- 2. ✅ INSERT policy checks BOTH car AND extra belong to user's company
-- 3. ✅ INSERT policy also verifies car and extra are from SAME company
-- 4. ✅ Uses separate table aliases (car_company, extra_company) for clarity
-- 5. ✅ Includes comprehensive verification queries
-- 6. ✅ Better error messages and diagnostics
--
-- Security Model:
-- - Users can only link extras to cars from their own company
-- - Users can only use extras that belong to their company
-- - Car and extra must be from the same company (prevents cross-company linking)
-- - All operations check company ownership via owner_id = auth.uid()
--
-- ============================================================================
