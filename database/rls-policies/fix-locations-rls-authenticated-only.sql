-- ============================================================================
-- FIX LOCATIONS RLS - AUTHENTICATED USERS ONLY
-- ============================================================================
-- Problem: Public policies blocking data visibility
-- Solution: Remove all public policies, keep only authenticated policies
-- ============================================================================

DO $$
BEGIN
  -- Ensure RLS is enabled (idempotent)
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

  -- ============================================================================
  -- STEP 1: DROP ALL EXISTING POLICIES (CLEAN SLATE)
  -- ============================================================================
  -- Remove all policies (both authenticated and public) to start fresh
  DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_select_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_company" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_company" ON public.locations;

  -- ============================================================================
  -- STEP 2: CREATE AUTHENTICATED-ONLY POLICIES
  -- ============================================================================
  -- Only authenticated users can access locations
  -- Public/anon users have NO policies = NO ACCESS

  -- SELECT: Authenticated users can only see locations from their company
  CREATE POLICY "locations_select_authenticated" ON public.locations
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- INSERT: Authenticated users can only create locations for their company
  CREATE POLICY "locations_insert_authenticated" ON public.locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- UPDATE: Authenticated users can only update locations from their company
  -- Both USING (check existing row) and WITH CHECK (verify new values)
  CREATE POLICY "locations_update_authenticated" ON public.locations
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- DELETE: Authenticated users can only delete locations from their company
  CREATE POLICY "locations_delete_authenticated" ON public.locations
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  RAISE NOTICE '✅ Locations RLS policies fixed successfully';
  RAISE NOTICE '✅ Only authenticated users can access locations';
  RAISE NOTICE '✅ Public/anon users have NO access (no policies = blocked)';
  RAISE NOTICE '✅ Company-scoped access enforced via companies.owner_id';
END $$;

-- ============================================================================
-- VERIFICATION: Check policies
-- ============================================================================
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

-- Expected result:
-- - 4 policies total (SELECT, INSERT, UPDATE, DELETE)
-- - All policies have roles = '{authenticated}'
-- - No policies for 'public' or 'anon'
-- - SELECT and DELETE have USING clause
-- - INSERT has WITH CHECK clause
-- - UPDATE has both USING and WITH CHECK clauses

