-- ============================================================================
-- FIX COMPANIES TABLE RLS - JWT-BASED OWNERSHIP
-- ============================================================================
-- Uses JWT company_id claim (same as locations table)
-- 1 user = 1 company
-- companies.id = JWT company_id
-- ============================================================================

DO $$
BEGIN
  -- Ensure RLS is enabled (idempotent)
  ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

  -- ============================================================================
  -- STEP 1: DROP ALL EXISTING POLICIES (CLEAN SLATE)
  -- ============================================================================
  DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
  DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;
  DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
  DROP POLICY IF EXISTS "companies_insert_authenticated" ON public.companies;
  DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
  DROP POLICY IF EXISTS "companies_update_authenticated" ON public.companies;
  DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;
  DROP POLICY IF EXISTS "companies_delete_authenticated" ON public.companies;

  -- ============================================================================
  -- STEP 2: CREATE JWT-BASED POLICIES (AUTHENTICATED ONLY)
  -- ============================================================================
  -- Use JWT company_id with fallback to user_metadata (same pattern as locations)
  
  -- SELECT: Authenticated users can only see their own company
  CREATE POLICY "companies_select_authenticated" ON public.companies
    FOR SELECT
    TO authenticated
    USING (
      -- Try direct JWT claim first
      companies.id = ((auth.jwt() ->> 'company_id')::uuid)
      OR
      -- Fallback: Try user_metadata (what we actually set up)
      companies.id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- INSERT: Authenticated users can only create their own company
  CREATE POLICY "companies_insert_authenticated" ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Try direct JWT claim first
      companies.id = ((auth.jwt() ->> 'company_id')::uuid)
      OR
      -- Fallback: Try user_metadata
      companies.id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- UPDATE: Authenticated users can only update their own company
  CREATE POLICY "companies_update_authenticated" ON public.companies
    FOR UPDATE
    TO authenticated
    USING (
      -- Try direct JWT claim first
      companies.id = ((auth.jwt() ->> 'company_id')::uuid)
      OR
      -- Fallback: Try user_metadata
      companies.id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    )
    WITH CHECK (
      -- Try direct JWT claim first
      companies.id = ((auth.jwt() ->> 'company_id')::uuid)
      OR
      -- Fallback: Try user_metadata
      companies.id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- DELETE: Usually restricted, but allow if needed
  CREATE POLICY "companies_delete_authenticated" ON public.companies
    FOR DELETE
    TO authenticated
    USING (
      -- Try direct JWT claim first
      companies.id = ((auth.jwt() ->> 'company_id')::uuid)
      OR
      -- Fallback: Try user_metadata
      companies.id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  RAISE NOTICE '✅ Companies RLS policies created (JWT-based)';
  RAISE NOTICE '✅ Uses same pattern as locations table';
END $$;

-- ============================================================================
-- STEP 3: FIX GRANTS (RLS ≠ PERMISSIONS)
-- ============================================================================
-- RLS policies control visibility, but GRANTS control permissions

-- Grant USAGE on schema (required for table access)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE public.companies TO authenticated;

-- Explicitly revoke from anon (security best practice)
REVOKE ALL ON TABLE public.companies FROM anon;
REVOKE ALL ON TABLE public.companies FROM public;

-- ============================================================================
-- VERIFICATION: Check policies and grants
-- ============================================================================

-- Check policies
SELECT 
  'Policies' as check_type,
  policyname,
  cmd as command,
  roles,
  CASE 
    WHEN qual::text LIKE '%company_id%' THEN 'Uses JWT company_id'
    ELSE 'Other'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'companies'
ORDER BY cmd, roles;

-- Check grants
SELECT 
  'Grants' as check_type,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND grantee IN ('authenticated', 'anon', 'public')
GROUP BY grantee
ORDER BY grantee;

-- Expected result:
-- Policies: 4 policies for authenticated role only
-- Grants: authenticated has SELECT, INSERT, UPDATE
-- Grants: anon/public have NO grants

