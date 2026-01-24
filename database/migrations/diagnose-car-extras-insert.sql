-- ============================================================================
-- DIAGNOSTIC: car_extras INSERT Issues
-- ============================================================================
-- 
-- Run this script to diagnose why car_extras INSERT is failing.
-- Replace 'YOUR_CAR_ID' and 'YOUR_EXTRA_ID' with actual IDs from your database.
--
-- ============================================================================

-- Step 1: Check authentication
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
    ELSE '✅ Authenticated'
  END as auth_status;

-- Step 2: Check if car exists and you own it
SELECT 
  c.id as car_id,
  c.make || ' ' || c.model as car_name,
  c.company_id as car_company_id,
  co.id as company_id,
  co.owner_id as company_owner_id,
  auth.uid() as current_user_id,
  CASE 
    WHEN co.owner_id = auth.uid() THEN '✅ You own this car'
    ELSE '❌ You do NOT own this car'
  END as ownership_status
FROM cars c
INNER JOIN companies co ON co.id = c.company_id
WHERE c.id = 'YOUR_CAR_ID';  -- Replace with your car ID

-- Step 3: Check if extra exists and you own it
SELECT 
  e.id as extra_id,
  e.name as extra_name,
  e.company_id as extra_company_id,
  co.id as company_id,
  co.owner_id as company_owner_id,
  auth.uid() as current_user_id,
  CASE 
    WHEN co.owner_id = auth.uid() THEN '✅ You own this extra'
    ELSE '❌ You do NOT own this extra'
  END as ownership_status
FROM extras e
INNER JOIN companies co ON co.id = e.company_id
WHERE e.id = 'YOUR_EXTRA_ID';  -- Replace with your extra ID

-- Step 4: Check if car and extra are from the same company
SELECT 
  c.id as car_id,
  c.company_id as car_company_id,
  e.id as extra_id,
  e.company_id as extra_company_id,
  CASE 
    WHEN c.company_id = e.company_id THEN '✅ Same company'
    ELSE '❌ Different companies - CANNOT LINK'
  END as company_match
FROM cars c
CROSS JOIN extras e
WHERE c.id = 'YOUR_CAR_ID'  -- Replace with your car ID
  AND e.id = 'YOUR_EXTRA_ID';  -- Replace with your extra ID

-- Step 5: Test the INSERT policy logic
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM public.cars
      INNER JOIN public.companies car_company ON car_company.id = cars.company_id
      INNER JOIN public.extras ON extras.id = 'YOUR_EXTRA_ID'  -- Replace
      INNER JOIN public.companies extra_company ON extra_company.id = extras.company_id
      WHERE cars.id = 'YOUR_CAR_ID'  -- Replace
        AND cars.company_id IS NOT NULL
        AND extras.company_id IS NOT NULL
        AND car_company.owner_id = auth.uid()
        AND extra_company.owner_id = auth.uid()
        AND cars.company_id = extras.company_id
    ) THEN '✅ Policy check PASSES - INSERT should work'
    ELSE '❌ Policy check FAILS - INSERT will be blocked'
  END as policy_check_result;

-- Step 6: Check existing policies
SELECT 
  policyname,
  cmd,
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_extras'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- Step 7: Check table permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'car_extras'
  AND grantee IN ('authenticated', 'anon');

-- Step 8: Check RLS status
SELECT 
  tablename,
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN '✅ RLS is enabled'
    ELSE '❌ RLS is NOT enabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'car_extras';

-- ============================================================================
-- QUICK FIX TEST
-- ============================================================================
-- If all checks above pass, try this test INSERT:
-- 
-- INSERT INTO public.car_extras (car_id, extra_id, price, is_included)
-- VALUES ('YOUR_CAR_ID', 'YOUR_EXTRA_ID', 10.00, false)
-- RETURNING *;
--
-- If this works, the issue is in the application code, not RLS.
-- If this fails, check the error message and compare with policy checks above.
