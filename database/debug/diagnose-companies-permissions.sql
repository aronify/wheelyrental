-- ============================================================================
-- COMPREHENSIVE PERMISSIONS DIAGNOSTIC FOR COMPANIES TABLE
-- This script identifies EXACTLY why "permission denied" occurs
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY RLS STATE (NO ASSUMPTIONS)
-- ============================================================================
SELECT 
  'STEP 1: RLS Status' as diagnostic_step,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS IS ENABLED - This could be the problem!'
    ELSE 'RLS is disabled (good)'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- Check relforcerowsecurity (PostgreSQL 15+)
SELECT 
  'STEP 1b: RLS Enforcement' as diagnostic_step,
  c.relname as table_name,
  c.relforcerowsecurity as force_rls, 
  CASE 
    WHEN c.relforcerowsecurity THEN 'RLS is FORCED - This blocks access!'
    ELSE 'RLS is not forced'
  END as force_rls_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'companies';

-- ============================================================================
-- STEP 2: CHECK TABLE OWNERSHIP
-- ============================================================================
SELECT 
  'STEP 2: Table Ownership' as diagnostic_step,
  schemaname,
  tablename,
  tableowner as owner_role,
  CASE 
    WHEN tableowner = 'postgres' THEN 'Owned by postgres (superuser)'
    WHEN tableowner = 'supabase_admin' THEN 'Owned by supabase_admin'
    WHEN tableowner = 'authenticator' THEN 'Owned by authenticator'
    ELSE 'Owned by: ' || tableowner
  END as ownership_note
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- ============================================================================
-- STEP 3: CHECK ROLE PERMISSIONS (CRITICAL)
-- ============================================================================
SELECT 
  'STEP 3: GRANT Permissions' as diagnostic_step,
  grantee as role_name,
  privilege_type,
  is_grantable,
  CASE 
    WHEN privilege_type = 'SELECT' THEN 'Can read'
    WHEN privilege_type = 'INSERT' THEN 'Can create'
    WHEN privilege_type = 'UPDATE' THEN 'Can modify'
    WHEN privilege_type = 'DELETE' THEN 'Can remove'
    WHEN privilege_type = 'TRUNCATE' THEN 'Can truncate'
    WHEN privilege_type = 'REFERENCES' THEN 'Can reference'
    WHEN privilege_type = 'TRIGGER' THEN 'Can trigger'
    ELSE privilege_type
  END as permission_description
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND grantee IN ('anon', 'authenticated', 'service_role', 'authenticator', 'postgres')
ORDER BY grantee, privilege_type;

-- Check if roles exist
SELECT 
  'STEP 3b: Role Existence' as diagnostic_step,
  rolname as role_name,
  CASE 
    WHEN rolname = 'anon' THEN 'anon role exists'
    WHEN rolname = 'authenticated' THEN 'authenticated role exists'
    WHEN rolname = 'service_role' THEN 'service_role exists'
    WHEN rolname = 'authenticator' THEN 'authenticator exists'
    ELSE 'Other role: ' || rolname
  END as role_status
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
ORDER BY rolname;

-- ============================================================================
-- STEP 4: CHECK WHICH ROLE IS ACTUALLY USED
-- ============================================================================
SELECT 
  'STEP 4: Current Role' as diagnostic_step,
  current_user as current_database_user,
  session_user as session_database_user,
  current_setting('role') as current_setting_role,
  CASE 
    WHEN current_user = 'anon' THEN 'Using anon role (public access)'
    WHEN current_user = 'authenticated' THEN 'Using authenticated role (logged in users)'
    WHEN current_user = 'service_role' THEN 'Using service_role (bypasses RLS)'
    WHEN current_user = 'authenticator' THEN 'Using authenticator (Supabase proxy)'
    ELSE 'Using role: ' || current_user
  END as role_description;

-- Check JWT claims (if available)
SELECT 
  'STEP 4b: JWT Claims' as diagnostic_step,
  current_setting('request.jwt.claims', true)::json->>'role' as jwt_role,
  current_setting('request.jwt.claims', true)::json->>'sub' as jwt_user_id,
  CASE 
    WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'anon' THEN 'JWT shows anon role'
    WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated' THEN 'JWT shows authenticated role'
    WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN 'JWT shows service_role'
    ELSE 'JWT role: ' || (current_setting('request.jwt.claims', true)::json->>'role')
  END as jwt_role_description;

-- ============================================================================
-- STEP 5: CHECK FOR MISSING GRANTS (DIAGNOSTIC)
-- ============================================================================
SELECT 
  'STEP 5: Missing Grants Analysis' as diagnostic_step,
  'anon' as role_to_check,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND grantee = 'anon'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) THEN 'MISSING: anon has NO permissions on companies table!'
    ELSE 'anon has some permissions'
  END as anon_status,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND grantee = 'authenticated'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) THEN 'MISSING: authenticated has NO permissions on companies table!'
    ELSE 'authenticated has some permissions'
  END as authenticated_status;

-- ============================================================================
-- STEP 6: GENERATE FIX SQL (IF PERMISSIONS ARE MISSING)
-- ============================================================================
SELECT 
  'STEP 6: Recommended Fix' as diagnostic_step,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND grantee = 'anon'
    ) THEN 'Run: GRANT ALL ON TABLE public.companies TO anon;'
    ELSE 'anon has permissions'
  END as fix_for_anon,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND grantee = 'authenticated'
    ) THEN 'Run: GRANT ALL ON TABLE public.companies TO authenticated;'
    ELSE 'authenticated has permissions'
  END as fix_for_authenticated;

