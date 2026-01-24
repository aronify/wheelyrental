-- ============================================================================
-- QUICK FIX: car_locations Permissions
-- ============================================================================
-- 
-- Run this script IMMEDIATELY to fix the "permission denied" error.
-- This script will:
-- 1. Grant proper permissions on the table
-- 2. Fix the RLS policies to allow DELETE operations
--
-- Copy and paste this entire script into Supabase SQL Editor and run it.
-- ============================================================================

-- Step 1: Grant permissions to authenticated users
GRANT ALL ON public.car_locations TO authenticated;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.car_locations ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate DELETE policy (the problematic one)
DROP POLICY IF EXISTS "car_locations_delete_policy" ON public.car_locations;

-- Recreate DELETE policy with proper permissions
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

-- Step 4: Also fix other policies to ensure consistency (remove 'anon' role)
DROP POLICY IF EXISTS "car_locations_select_policy" ON public.car_locations;
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

DROP POLICY IF EXISTS "car_locations_insert_policy" ON public.car_locations;
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

DROP POLICY IF EXISTS "car_locations_update_policy" ON public.car_locations;
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
-- VERIFICATION
-- ============================================================================
-- After running, verify the fix worked:

-- Check policies exist
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_locations';
-- Should show 4 policies, all with 'authenticated' role

-- Test that you can now delete (replace with your actual car_id)
-- DELETE FROM public.car_locations WHERE car_id = 'YOUR_CAR_ID';
-- Should work without permission errors

-- ============================================================================
-- DONE!
-- ============================================================================
-- The permission error should now be fixed. Try updating a car's locations again.
