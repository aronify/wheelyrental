-- ============================================================================
-- COMPREHENSIVE RLS VERIFICATION
-- ============================================================================
-- This script verifies that RLS is properly configured for all tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify RLS is enabled on all tables
-- ============================================================================
SELECT 
  'RLS Status' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'car_blocks', 'cars', 'companies', 'customers', 'locations', 'reviews', 'user_companies')
ORDER BY tablename;

-- ============================================================================
-- STEP 2: Verify policies exist for all tables
-- ============================================================================
SELECT 
  'Policy Count' as check_type,
  tablename,
  COUNT(*) as policy_count,
  string_agg(DISTINCT cmd::text, ', ' ORDER BY cmd) as operations_covered
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'car_blocks', 'cars', 'companies', 'customers', 'locations', 'reviews', 'user_companies')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- STEP 3: Verify grants (what you already checked)
-- ============================================================================
SELECT 
  'Grants Summary' as check_type,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon', 'public')
  AND table_name IN ('bookings', 'car_blocks', 'cars', 'companies', 'customers', 'locations', 'reviews', 'user_companies')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- ============================================================================
-- STEP 4: Verify anon and public have NO access
-- ============================================================================
SELECT 
  'Security Check: Anon/Public Access' as check_type,
  table_name,
  grantee,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ HAS ACCESS (SECURITY RISK!)'
    ELSE '✅ No access (secure)'
  END as security_status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'public')
  AND table_name IN ('bookings', 'car_blocks', 'cars', 'companies', 'customers', 'locations', 'reviews', 'user_companies')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- ============================================================================
-- STEP 5: Check policy details for tables with company_id
-- ============================================================================
SELECT 
  'Policy Details (company_id tables)' as check_type,
  p.tablename,
  p.policyname,
  p.cmd as operation,
  CASE 
    WHEN p.qual LIKE '%auth.jwt()%' THEN '✅ Uses JWT'
    WHEN p.qual LIKE '%auth.uid()%' THEN '✅ Uses auth.uid()'
    WHEN p.qual LIKE '%EXISTS%companies%' THEN '✅ Uses company lookup fallback'
    ELSE '⚠️  Check policy logic'
  END as policy_type,
  CASE 
    WHEN p.qual LIKE '%IS NULL%' THEN '✅ Has fallback logic'
    ELSE '⚠️  May not have fallback'
  END as has_fallback
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('bookings', 'car_blocks', 'cars', 'companies', 'locations', 'reviews')
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = p.tablename
      AND c.column_name = 'company_id'
  )
ORDER BY p.tablename, p.cmd;

-- ============================================================================
-- STEP 6: Check policy details for user-owned tables
-- ============================================================================
SELECT 
  'Policy Details (user-owned tables)' as check_type,
  p.tablename,
  p.policyname,
  p.cmd as operation,
  CASE 
    WHEN p.qual LIKE '%auth.uid()%' THEN '✅ Uses auth.uid()'
    ELSE '⚠️  Check policy logic'
  END as policy_type
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('customers', 'user_companies')
  AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = p.tablename
      AND c.column_name = 'company_id'
  )
ORDER BY p.tablename, p.cmd;

-- ============================================================================
-- STEP 7: Check user_companies table structure
-- ============================================================================
SELECT 
  'Table Structure: user_companies' as check_type,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('user_id', 'owner_id', 'company_id') THEN '✅ Ownership column'
    ELSE 'Regular column'
  END as column_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_companies'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 8: Summary and recommendations
-- ============================================================================
SELECT 
  'Summary' as check_type,
  'All checks complete' as status,
  'Review the results above' as instruction;

