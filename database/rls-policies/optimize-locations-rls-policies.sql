-- ============================================================================
-- OPTIMIZE LOCATIONS RLS POLICIES FOR EXISTING STRUCTURE
-- ============================================================================
-- This script optimizes the existing RLS policies to work efficiently
-- with the authenticated role and company-based access
-- ============================================================================

DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

  -- Drop old policies if they exist (cleanup)
  DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;

  -- OPTIMIZED: SELECT policy for authenticated users
  -- Uses companies.owner_id to link user to company
  -- This policy will be used when user is authenticated
  CREATE POLICY "locations_select_company" ON public.locations
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

  -- OPTIMIZED: INSERT policy for authenticated users
  CREATE POLICY "locations_insert_company" ON public.locations
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

  -- OPTIMIZED: UPDATE policy for authenticated users
  -- Both USING and WITH CHECK ensure security
  CREATE POLICY "locations_update_company" ON public.locations
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

  -- OPTIMIZED: DELETE policy for authenticated users
  CREATE POLICY "locations_delete_company" ON public.locations
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

  -- Public policies (if needed for unauthenticated access - usually not needed)
  -- These are typically set to false or removed for security
  -- Keeping them as restrictive for safety
  CREATE POLICY "locations_select_policy" ON public.locations
    FOR SELECT
    TO public
    USING (false);

  CREATE POLICY "locations_insert_policy" ON public.locations
    FOR INSERT
    TO public
    WITH CHECK (false);

  CREATE POLICY "locations_update_policy" ON public.locations
    FOR UPDATE
    TO public
    USING (false)
    WITH CHECK (false);

  CREATE POLICY "locations_delete_policy" ON public.locations
    FOR DELETE
    TO public
    USING (false);

  RAISE NOTICE 'Locations RLS policies optimized successfully';
  RAISE NOTICE 'Authenticated users can access their company locations';
  RAISE NOTICE 'Public access is blocked for security';
END $$;

-- Verify policies
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'locations'
ORDER BY cmd, roles;

