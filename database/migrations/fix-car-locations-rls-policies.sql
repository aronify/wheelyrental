-- ============================================================================
-- FIX: car_locations RLS POLICIES
-- ============================================================================
-- 
-- This script updates the car_locations RLS policies to use owner_id
-- directly (matching the pattern used in cars and locations tables)
-- instead of the user_has_company_access() function.
--
-- The issue: car_locations policies were using user_has_company_access()
-- which may not work correctly with the owner_id-based security model.
--
-- The fix: Update all car_locations policies to check owner_id directly
-- by joining through cars -> companies -> owner_id = auth.uid()
--
-- ============================================================================

-- Ensure RLS is enabled on car_locations table
ALTER TABLE public.car_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "car_locations_select_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_insert_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_update_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_delete_policy" ON public.car_locations;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================
-- Users can SELECT only car_locations for cars from their company
-- Check: car -> company -> owner_id = auth.uid()
CREATE POLICY "car_locations_select_policy" ON public.car_locations
  FOR SELECT
  TO authenticated, anon
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
-- Check: car -> company -> owner_id = auth.uid()
CREATE POLICY "car_locations_insert_policy" ON public.car_locations
  FOR INSERT
  TO authenticated, anon
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
-- Check: car -> company -> owner_id = auth.uid()
CREATE POLICY "car_locations_update_policy" ON public.car_locations
  FOR UPDATE
  TO authenticated, anon
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
-- DELETE POLICY
-- ============================================================================
-- Users can DELETE car_locations for cars from their company
-- Check: car -> company -> owner_id = auth.uid()
CREATE POLICY "car_locations_delete_policy" ON public.car_locations
  FOR DELETE
  TO authenticated, anon
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
-- Uncomment to verify policies were created:

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'car_locations';
-- Expected: rowsecurity = true

-- Check policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'car_locations';
-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Security Model:
-- 1. All policies check company ownership via owner_id = auth.uid()
-- 2. Policies join cars -> companies to verify ownership
-- 3. This matches the pattern used in cars and locations tables
--
-- Performance:
-- - Policies use EXISTS subqueries with INNER JOIN which are optimized by PostgreSQL
-- - Indexes on car_locations.car_id, cars.company_id, and companies.owner_id improve performance
-- - RLS policies are evaluated efficiently by PostgreSQL query planner
--
-- ============================================================================
