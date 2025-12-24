-- ============================================================================
-- FINAL FIX: LOCATIONS RLS - WORKING SOLUTION
-- ============================================================================
-- If JWT doesn't have company_id, use fallback to companies table
-- This ensures RLS works even if JWT claims are missing
-- ============================================================================

DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

  -- Drop all existing policies
  DROP POLICY IF EXISTS "locations_select_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_select_authenticated" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_authenticated" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_authenticated" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_authenticated" ON public.locations;

  -- ============================================================================
  -- CREATE POLICIES WITH FALLBACK
  -- ============================================================================
  -- Try JWT first, fallback to companies table lookup if JWT is missing
  -- This ensures RLS works even if JWT claims aren't populated

  -- SELECT: Use JWT if available, otherwise check companies table
  CREATE POLICY "locations_select_authenticated" ON public.locations
    FOR SELECT
    TO authenticated
    USING (
      -- Try JWT first
      (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = locations.company_id
      OR
      -- Fallback: Check companies table directly
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- INSERT: Use JWT if available, otherwise check companies table
  CREATE POLICY "locations_insert_authenticated" ON public.locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Try JWT first
      (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = locations.company_id
      OR
      -- Fallback: Check companies table directly
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- UPDATE: Use JWT if available, otherwise check companies table
  CREATE POLICY "locations_update_authenticated" ON public.locations
    FOR UPDATE
    TO authenticated
    USING (
      -- Try JWT first
      (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = locations.company_id
      OR
      -- Fallback: Check companies table directly
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      -- Try JWT first
      (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = locations.company_id
      OR
      -- Fallback: Check companies table directly
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- DELETE: Use JWT if available, otherwise check companies table
  CREATE POLICY "locations_delete_authenticated" ON public.locations
    FOR DELETE
    TO authenticated
    USING (
      -- Try JWT first
      (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = locations.company_id
      OR
      -- Fallback: Check companies table directly
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  RAISE NOTICE '✅ Policies created with JWT + fallback to companies table';
  RAISE NOTICE '✅ Works even if JWT claims are missing';
END $$;

-- Verify policies
SELECT 
  policyname,
  cmd as command,
  roles,
  CASE 
    WHEN qual::text LIKE '%user_metadata%' THEN 'Uses JWT + fallback'
    ELSE 'Other'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'locations'
ORDER BY cmd;

