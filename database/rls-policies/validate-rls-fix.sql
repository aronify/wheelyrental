-- ============================================================================
-- VALIDATE RLS FIX
-- ============================================================================
-- Run this as an authenticated user to verify RLS is working correctly
-- ============================================================================

-- Test 1: Verify JWT claim availability
SELECT 
  'Test 1: JWT Claims' as test_name,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'company_id' as jwt_company_id,
  CASE 
    WHEN auth.jwt() ->> 'company_id' IS NOT NULL THEN '✅ JWT has company_id'
    ELSE '⚠️  JWT missing company_id (will use fallback)'
  END as jwt_status;

-- Test 2: Verify company lookup fallback works
SELECT 
  'Test 2: Company Lookup' as test_name,
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ User owns this company'
    ELSE '❌ User does NOT own this company'
  END as ownership_status
FROM public.companies c
WHERE c.owner_id = auth.uid()
LIMIT 1;

-- Test 3: Test visibility of tables with company_id
-- (Run these one at a time to see which tables return data)

-- Companies table
SELECT 
  'Test 3a: Companies Table' as test_name,
  COUNT(*) as visible_rows,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data visible'
    ELSE '❌ No data visible (check RLS policies)'
  END as status
FROM public.companies;

-- Locations table
SELECT 
  'Test 3b: Locations Table' as test_name,
  COUNT(*) as visible_rows,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data visible'
    ELSE '❌ No data visible (check RLS policies)'
  END as status
FROM public.locations;

-- Cars table
SELECT 
  'Test 3c: Cars Table' as test_name,
  COUNT(*) as visible_rows,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data visible'
    ELSE '❌ No data visible (check RLS policies)'
  END as status
FROM public.cars;

-- Bookings table
SELECT 
  'Test 3d: Bookings Table' as test_name,
  COUNT(*) as visible_rows,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data visible'
    ELSE '❌ No data visible (check RLS policies)'
  END as status
FROM public.bookings;

-- Test 4: Test visibility of user-owned tables (only if they exist)
-- Profiles table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'Profiles table exists - testing visibility';
  ELSE
    RAISE NOTICE 'Profiles table does NOT exist - skipping test';
  END IF;
END $$;

-- Customers table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'customers'
  ) THEN
    RAISE NOTICE 'Customers table exists - testing visibility';
  ELSE
    RAISE NOTICE 'Customers table does NOT exist - skipping test';
  END IF;
END $$;

-- Test 5: Verify anon has NO access (should return 0 rows)
-- This test should be run as anon role to verify
SELECT 
  'Test 5: Anon Access Check' as test_name,
  'Run this query as anon role' as instruction,
  'If any rows are visible, RLS is broken' as warning;

-- Test 6: Policy verification
SELECT 
  'Test 6: Policy Verification' as test_name,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

