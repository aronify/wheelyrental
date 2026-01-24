-- ============================================================================
-- FIX: car_extras RLS Permissions
-- ============================================================================
-- 
-- This script fixes the RLS policies for car_extras table to ensure
-- INSERT operations work correctly when adding extras to cars.
--
-- The issue: RLS policies may be blocking INSERT operations
-- The fix: Update policies to use only 'authenticated' role and ensure
--          proper company ownership checks via owner_id
--
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Grant permissions to authenticated users
GRANT ALL ON public.car_extras TO authenticated;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to recreate them
DROP POLICY IF EXISTS "car_extras_select_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_select_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_company" ON public.car_extras;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================
-- Users can SELECT car_extras for cars from their company
CREATE POLICY "car_extras_select_policy" ON public.car_extras
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- INSERT POLICY (CRITICAL - This is what was blocking you)
-- ============================================================================
-- Users can INSERT car_extras for cars from their company
CREATE POLICY "car_extras_insert_policy" ON public.car_extras
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
    AND
    -- Also verify the extra belongs to the same company
    EXISTS (
      SELECT 1 FROM public.extras
      INNER JOIN public.companies ON companies.id = extras.company_id
      WHERE extras.id = car_extras.extra_id
        AND extras.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================
-- Users can UPDATE car_extras for cars from their company
CREATE POLICY "car_extras_update_policy" ON public.car_extras
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
    AND
    -- Also verify the extra belongs to the same company
    EXISTS (
      SELECT 1 FROM public.extras
      INNER JOIN public.companies ON companies.id = extras.company_id
      WHERE extras.id = car_extras.extra_id
        AND extras.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- DELETE POLICY
-- ============================================================================
-- Users can DELETE car_extras for cars from their company
CREATE POLICY "car_extras_delete_policy" ON public.car_extras
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, verify the fix worked:

-- Check policies exist
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_extras'
ORDER BY cmd;
-- Should show 4 policies, all with 'authenticated' role

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'car_extras';
-- Expected: rowsecurity = true

-- Test INSERT (replace with your actual car_id and extra_id)
-- INSERT INTO public.car_extras (car_id, extra_id, price, is_included)
-- VALUES ('YOUR_CAR_ID', 'YOUR_EXTRA_ID', 10.00, false);
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
-- 2. Verify the car belongs to your company:
--    SELECT c.id, c.company_id, co.owner_id, auth.uid()
--    FROM cars c
--    INNER JOIN companies co ON co.id = c.company_id
--    WHERE c.id = 'YOUR_CAR_ID';
--    Should show owner_id matches auth.uid()
--
-- 3. Verify the extra belongs to your company:
--    SELECT e.id, e.company_id, co.owner_id, auth.uid()
--    FROM extras e
--    INNER JOIN companies co ON co.id = e.company_id
--    WHERE e.id = 'YOUR_EXTRA_ID';
--    Should show owner_id matches auth.uid()
--
-- 4. Check if policies are being applied:
--    EXPLAIN (ANALYZE, BUFFERS)
--    INSERT INTO car_extras (car_id, extra_id, price, is_included)
--    VALUES ('YOUR_CAR_ID', 'YOUR_EXTRA_ID', 10.00, false);
--    Look for "Filter" in the plan showing the policy check
--
-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Key changes:
-- 1. Removed 'anon' role from policies (only 'authenticated' users should access)
-- 2. Policies use INNER JOIN to ensure company exists
-- 3. INSERT policy also verifies the extra belongs to the same company
-- 4. All policies check owner_id = auth.uid() for security
-- 5. Added GRANT permissions to authenticated role
--
-- Security:
-- - Only authenticated users can access car_extras
-- - Users can only access car_extras for cars from companies they own
-- - Users can only link extras that belong to their company
-- - All operations are company-scoped
--
-- ============================================================================
