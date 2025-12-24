-- ============================================================================
-- FIX LOCATIONS RLS - USE USER_METADATA PATH
-- ============================================================================
-- Update policies to use: auth.jwt() -> 'user_metadata' ->> 'company_id'
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

  -- CREATE POLICIES USING USER_METADATA PATH
  -- user_metadata IS included in JWT automatically
  
  -- SELECT: Use user_metadata.company_id
  CREATE POLICY "locations_select_jwt" ON public.locations
    FOR SELECT
    TO authenticated
    USING (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- INSERT: Use user_metadata.company_id
  CREATE POLICY "locations_insert_jwt" ON public.locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- UPDATE: Use user_metadata.company_id
  CREATE POLICY "locations_update_jwt" ON public.locations
    FOR UPDATE
    TO authenticated
    USING (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    )
    WITH CHECK (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- DELETE: Use user_metadata.company_id
  CREATE POLICY "locations_delete_jwt" ON public.locations
    FOR DELETE
    TO authenticated
    USING (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  RAISE NOTICE '✅ Policies updated to use user_metadata.company_id';
END $$;

-- Verify policies
SELECT 
  'Policy Verification' as check_type,
  policyname,
  cmd as command,
  roles,
  LEFT(qual::text, 100) as using_clause_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'locations'
ORDER BY cmd;

-- Test JWT path (run while authenticated)
SELECT 
  'JWT Test' as check_type,
  auth.uid() as user_id,
  auth.jwt() -> 'user_metadata' ->> 'company_id' as company_id_from_jwt,
  CASE 
    WHEN auth.jwt() -> 'user_metadata' ->> 'company_id' IS NULL THEN '❌ MISSING - User must re-login'
    ELSE '✅ EXISTS: ' || (auth.jwt() -> 'user_metadata' ->> 'company_id')
  END as status;

