-- ============================================================================
-- FIX: car_extras RLS POLICIES (Version 2 - With Verification)
-- ============================================================================
-- 
-- This script updates the car_extras RLS policies and verifies they were created.
-- Run this if the previous script said "successful" but didn't create policies.
--
-- ============================================================================

-- Step 1: Verify table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'car_extras'
  ) THEN
    RAISE EXCEPTION 'Table car_extras does not exist. Please create it first.';
  END IF;
  RAISE NOTICE '✅ Table car_extras exists';
END $$;

-- Step 2: Enable RLS
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN RAISE NOTICE '✅ RLS enabled on car_extras'; END $$;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "car_extras_select_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_select_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_company" ON public.car_extras;
DO $$ BEGIN RAISE NOTICE '✅ Old policies dropped'; END $$;

-- Step 4: Create SELECT policy
CREATE POLICY "car_extras_select_policy" ON public.car_extras
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ SELECT policy created'; END $$;

-- Step 5: Create INSERT policy
CREATE POLICY "car_extras_insert_policy" ON public.car_extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ INSERT policy created'; END $$;

-- Step 6: Create UPDATE policy
CREATE POLICY "car_extras_update_policy" ON public.car_extras
  FOR UPDATE
  TO authenticated, anon
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
  );
DO $$ BEGIN RAISE NOTICE '✅ UPDATE policy created'; END $$;

-- Step 7: Create DELETE policy
CREATE POLICY "car_extras_delete_policy" ON public.car_extras
  FOR DELETE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );
DO $$ BEGIN RAISE NOTICE '✅ DELETE policy created'; END $$;

-- Step 8: Verify policies were created
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

-- Step 9: Show created policies
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  '✅ Created' as "Status"
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_extras'
ORDER BY cmd;
