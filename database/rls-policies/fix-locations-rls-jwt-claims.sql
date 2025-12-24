-- ============================================================================
-- FIX LOCATIONS RLS - JWT CLAIMS BASED (NO JOINS)
-- ============================================================================
-- Uses auth.jwt() ->> 'company_id' from JWT token
-- No joins to companies table required
-- ============================================================================

DO $$
BEGIN
  -- Ensure RLS is enabled (idempotent)
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

  -- ============================================================================
  -- STEP 1: DROP ALL EXISTING POLICIES (CLEAN SLATE)
  -- ============================================================================
  DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_select_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_select_authenticated" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_authenticated" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_authenticated" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_authenticated" ON public.locations;

  -- ============================================================================
  -- STEP 2: CREATE JWT-BASED POLICIES (AUTHENTICATED ONLY)
  -- ============================================================================
  -- All policies use: locations.company_id = (auth.jwt() ->> 'company_id')::uuid
  -- No joins needed - JWT contains company_id directly

  -- SELECT: Authenticated users see only their company's locations
  CREATE POLICY "locations_select_jwt" ON public.locations
    FOR SELECT
    TO authenticated
    USING (
      locations.company_id = (auth.jwt() ->> 'company_id')::uuid
    );

  -- INSERT: Authenticated users can only create locations for their company
  CREATE POLICY "locations_insert_jwt" ON public.locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      locations.company_id = (auth.jwt() ->> 'company_id')::uuid
    );

  -- UPDATE: Authenticated users can only update their company's locations
  CREATE POLICY "locations_update_jwt" ON public.locations
    FOR UPDATE
    TO authenticated
    USING (
      locations.company_id = (auth.jwt() ->> 'company_id')::uuid
    )
    WITH CHECK (
      locations.company_id = (auth.jwt() ->> 'company_id')::uuid
    );

  -- DELETE: Authenticated users can only delete their company's locations
  CREATE POLICY "locations_delete_jwt" ON public.locations
    FOR DELETE
    TO authenticated
    USING (
      locations.company_id = (auth.jwt() ->> 'company_id')::uuid
    );

  RAISE NOTICE '✅ Locations RLS policies created (JWT-based)';
  RAISE NOTICE '✅ Using auth.jwt() ->> company_id (no joins)';
  RAISE NOTICE '✅ Authenticated users only';
END $$;

-- ============================================================================
-- STEP 3: FIX GRANTS (RLS ≠ PERMISSIONS)
-- ============================================================================
-- RLS policies control visibility, but GRANTS control permissions
-- authenticated role needs explicit permissions

-- Grant USAGE on schema (required for table access)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.locations TO authenticated;

-- Explicitly revoke from anon (security best practice)
REVOKE ALL ON TABLE public.locations FROM anon;
REVOKE ALL ON TABLE public.locations FROM public;

-- ============================================================================
-- VERIFICATION: Check policies and grants
-- ============================================================================

-- Check policies
SELECT 
  policyname,
  cmd as command,
  roles,
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
  AND tablename = 'locations'
ORDER BY cmd, roles;

-- Check grants
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'locations'
  AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY grantee, privilege_type;

-- Expected result:
-- Policies: 4 policies for authenticated role only
-- Grants: authenticated has SELECT, INSERT, UPDATE, DELETE
-- Grants: anon/public have NO grants

