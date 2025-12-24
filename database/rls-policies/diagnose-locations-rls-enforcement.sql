-- ============================================================================
-- DIAGNOSE LOCATIONS RLS ENFORCEMENT
-- ============================================================================
-- Check if RLS is actually working and why locations are visible
-- ============================================================================

-- STEP 1: Check RLS status
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS is ENABLED'
    ELSE '❌ RLS is DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'locations';

-- STEP 2: Check current policies
SELECT 
  'Current Policies' as check_type,
  policyname,
  cmd as command,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'locations'
ORDER BY cmd;

-- STEP 3: Check JWT claims (run while authenticated)
SELECT 
  'JWT Claims' as check_type,
  auth.uid() as current_user_id,
  auth.jwt() -> 'user_metadata' ->> 'company_id' as company_id_from_user_metadata,
  auth.jwt() ->> 'company_id' as company_id_direct,
  auth.jwt() as full_jwt;

-- STEP 4: Test RLS enforcement - Try to query locations
-- This should only return locations where company_id matches JWT
SELECT 
  'RLS Test Query' as check_type,
  COUNT(*) as visible_locations,
  COUNT(DISTINCT company_id) as distinct_companies,
  array_agg(DISTINCT company_id) as company_ids_visible
FROM public.locations;

-- STEP 5: Check what company_id the current user should see
SELECT 
  'Expected Company' as check_type,
  c.id as expected_company_id,
  c.name as company_name,
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'company_id' as user_metadata_company_id
FROM auth.users u
LEFT JOIN public.companies c ON c.owner_id = u.id
WHERE u.id = auth.uid();

-- STEP 6: Check all locations and their company_ids
SELECT 
  'All Locations' as check_type,
  l.id as location_id,
  l.name as location_name,
  l.company_id,
  c.name as company_name,
  c.owner_id as company_owner_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ Should be visible'
    ELSE '❌ Should NOT be visible'
  END as visibility_status
FROM public.locations l
LEFT JOIN public.companies c ON c.id = l.company_id
ORDER BY l.created_at DESC
LIMIT 20;

-- STEP 7: Test if RLS is actually blocking
-- This query should fail or return empty if RLS is working
SELECT 
  'RLS Enforcement Test' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ RLS is blocking correctly'
    WHEN COUNT(*) > 0 THEN 
      CASE 
        WHEN COUNT(DISTINCT company_id) = 1 THEN '⚠️ RLS might be working (only one company visible)'
        ELSE '❌ RLS is NOT working (multiple companies visible)'
      END
    ELSE 'Unknown'
  END as rls_status,
  COUNT(*) as total_visible,
  COUNT(DISTINCT company_id) as companies_visible
FROM public.locations;

