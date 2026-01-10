-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR car_locations TABLE
-- ============================================================================
-- 
-- This script creates comprehensive RLS policies for the car_locations
-- junction table to ensure:
-- 1. Users can only access car_locations for cars from their company
-- 2. Users can only create car_locations for cars they have access to
-- 3. Users can only update/delete car_locations for cars from their company
-- 4. All operations are company-scoped via user_has_company_access()
--
-- Prerequisites:
-- - car_locations table must exist
-- - user_has_company_access() function must exist (from rls-security-policies.sql)
-- - RLS must be enabled on cars and locations tables
--
-- Usage:
-- Run this script in Supabase SQL Editor after creating the car_locations table
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
-- This ensures users can only see location associations for cars they have access to
CREATE POLICY "car_locations_select_policy" ON public.car_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND public.user_has_company_access(cars.company_id)
    )
  );

-- ============================================================================
-- INSERT POLICY
-- ============================================================================
-- Users can INSERT car_locations for cars from their company
-- This ensures users can only create location associations for cars they own/manage
-- Additional validation: The trigger validate_car_location_company() will ensure
-- the location also belongs to the same company
CREATE POLICY "car_locations_insert_policy" ON public.car_locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND public.user_has_company_access(cars.company_id)
    )
    -- Note: The database trigger validate_car_location_company() will also verify:
    -- - The location exists
    -- - The location belongs to the same company as the car
    -- - The location type matches (is_pickup/is_dropoff flags)
  );

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================
-- Users can UPDATE car_locations for cars from their company
-- This allows users to change location_type or location_id for existing associations
-- The trigger will validate company ownership and type matching
CREATE POLICY "car_locations_update_policy" ON public.car_locations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND public.user_has_company_access(cars.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND public.user_has_company_access(cars.company_id)
    )
  );

-- ============================================================================
-- DELETE POLICY
-- ============================================================================
-- Users can DELETE car_locations for cars from their company
-- This allows users to remove location associations for cars they manage
CREATE POLICY "car_locations_delete_policy" ON public.car_locations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND public.user_has_company_access(cars.company_id)
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
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
-- 1. All policies check company ownership via user_has_company_access()
-- 2. Policies are based on car ownership, not location ownership
-- 3. Database trigger validate_car_location_company() provides additional
--    validation for company matching and type checking
--
-- Performance:
-- - Policies use EXISTS subqueries which are optimized by PostgreSQL
-- - Indexes on car_locations.car_id and cars.company_id improve performance
-- - RLS policies are evaluated efficiently by PostgreSQL query planner
--
-- Testing:
-- - Test with different users from different companies
-- - Verify users cannot access car_locations for other companies' cars
-- - Verify users can create/update/delete car_locations for their own cars
-- - Verify trigger prevents cross-company location assignments
--
-- ============================================================================


