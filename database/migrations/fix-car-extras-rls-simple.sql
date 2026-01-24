-- ============================================================================
-- SIMPLE FIX: car_extras RLS Policies (Alternative Approach)
-- ============================================================================
-- 
-- This is a simpler version that might work better if the complex version fails.
-- It uses a more straightforward approach to checking permissions.
--
-- Run this if fix-car-extras-rls-complete.sql doesn't work
-- ============================================================================

-- Step 1: Grant permissions
GRANT ALL ON public.car_extras TO authenticated;
GRANT ALL ON public.car_extras TO anon;

-- Step 2: Enable RLS
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "car_extras_select_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_select_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_company" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_company" ON public.car_extras;

-- ============================================================================
-- SIMPLIFIED POLICIES
-- ============================================================================

-- SELECT: Can see car_extras for cars you own
CREATE POLICY "car_extras_select_policy" ON public.car_extras
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND companies.owner_id = auth.uid()
    )
  );

-- INSERT: Can add extras to cars you own, and extras you own
-- Simplified: Just check car ownership (extras are already validated in app)
CREATE POLICY "car_extras_insert_policy" ON public.car_extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND companies.owner_id = auth.uid()
    )
  );

-- UPDATE: Can update car_extras for cars you own
CREATE POLICY "car_extras_update_policy" ON public.car_extras
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND companies.owner_id = auth.uid()
    )
  );

-- DELETE: Can delete car_extras for cars you own
CREATE POLICY "car_extras_delete_policy" ON public.car_extras
  FOR DELETE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_extras.car_id
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  'Policy Count' as check_type,
  COUNT(*)::text as result
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_extras'
UNION ALL
SELECT 
  'RLS Enabled' as check_type,
  CASE WHEN rowsecurity THEN 'Yes' ELSE 'No' END
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'car_extras';

-- Show policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_extras'
ORDER BY cmd;
