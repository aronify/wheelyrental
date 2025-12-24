-- ============================================================================
-- DEBUG CARS RLS ISSUE
-- ============================================================================
-- Run this as an authenticated user to check if RLS is blocking car queries
-- ============================================================================

-- Test 1: Check if you can see cars at all
SELECT 
  'Test 1: Cars Visibility' as test_name,
  COUNT(*) as total_cars,
  COUNT(*) FILTER (WHERE company_id IS NOT NULL) as cars_with_company_id
FROM public.cars;

-- Test 2: Check your company_id
SELECT 
  'Test 2: Company ID Check' as test_name,
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  auth.uid() as current_user_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ User owns this company'
    ELSE '❌ User does NOT own this company'
  END as ownership_status
FROM public.companies c
WHERE c.owner_id = auth.uid()
LIMIT 1;

-- Test 3: Check JWT company_id
SELECT 
  'Test 3: JWT Company ID' as test_name,
  auth.jwt() ->> 'company_id' as jwt_company_id,
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.jwt() ->> 'company_id' IS NOT NULL THEN '✅ JWT has company_id'
    ELSE '⚠️  JWT missing company_id (will use fallback)'
  END as jwt_status;

-- Test 4: Try to query cars (this is what the page does)
SELECT 
  'Test 4: Cars Query' as test_name,
  id,
  company_id,
  make,
  model,
  license_plate,
  status
FROM public.cars
ORDER BY created_at DESC
LIMIT 10;

-- Test 5: Check RLS policies on cars table
SELECT 
  'Test 5: RLS Policies' as test_name,
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'cars'
ORDER BY cmd;

-- Test 6: Check if cars table has RLS enabled
SELECT 
  'Test 6: RLS Status' as test_name,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'cars';

