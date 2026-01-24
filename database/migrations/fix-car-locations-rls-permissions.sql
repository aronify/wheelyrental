-- ============================================================================
-- FIX: car_locations RLS Permissions
-- ============================================================================
-- 
-- This script fixes the RLS policies for car_locations table to ensure
-- DELETE operations work correctly. The issue is that policies need to be
-- properly configured to allow users to delete car_locations for their cars.
--
-- Run this script in Supabase SQL Editor after the table is created.
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.car_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "car_locations_select_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_insert_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_update_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_delete_policy" ON public.car_locations;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================
-- Users can SELECT car_locations for cars from their company
CREATE POLICY "car_locations_select_policy" ON public.car_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- INSERT POLICY
-- ============================================================================
-- Users can INSERT car_locations for cars from their company
CREATE POLICY "car_locations_insert_policy" ON public.car_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================
-- Users can UPDATE car_locations for cars from their company
CREATE POLICY "car_locations_update_policy" ON public.car_locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- DELETE POLICY (FIXED)
-- ============================================================================
-- Users can DELETE car_locations for cars from their company
-- This is the critical policy that was causing permission errors
CREATE POLICY "car_locations_delete_policy" ON public.car_locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Uncomment to verify policies were created correctly:

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'car_locations';
-- Expected: rowsecurity = true

-- Check all policies exist
-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   permissive, 
--   roles, 
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'car_locations';
-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- Test DELETE permission (replace with actual car_id from your database)
-- DELETE FROM public.car_locations 
-- WHERE car_id = 'YOUR_CAR_ID_HERE';
-- Should work if you own the car's company

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
-- 3. Check if policies are being applied:
--    EXPLAIN (ANALYZE, BUFFERS)
--    DELETE FROM car_locations WHERE car_id = 'YOUR_CAR_ID';
--    Look for "Filter" in the plan showing the policy check
--
-- 4. Verify table grants (if using service role):
--    GRANT ALL ON public.car_locations TO authenticated;
--    GRANT ALL ON public.car_locations TO anon;
--
-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Key changes:
-- 1. Removed 'anon' role from policies (only 'authenticated' users should access)
-- 2. Policies use INNER JOIN to ensure company exists
-- 3. DELETE policy uses same pattern as other policies
-- 4. All policies check owner_id = auth.uid() for security
--
-- Security:
-- - Only authenticated users can access car_locations
-- - Users can only access car_locations for cars from companies they own
-- - All operations are company-scoped
--
-- ============================================================================
