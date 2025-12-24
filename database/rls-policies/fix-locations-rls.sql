-- ============================================================================
-- FIX LOCATIONS TABLE RLS POLICIES
-- ============================================================================
-- Problem: RLS policies are set to USING (false), blocking ALL access
-- Solution: Create proper tenant-aware policies using company_id
-- ============================================================================

DO $$
BEGIN
  -- Enable RLS (idempotent)
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

  -- Drop existing blocking policies
  DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;

  -- SELECT: Users can only see locations from their company
  -- Uses companies.owner_id to link user to company
  CREATE POLICY "locations_select_policy" ON public.locations
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- INSERT: Users can only create locations for their company
  CREATE POLICY "locations_insert_policy" ON public.locations
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  -- UPDATE: Users can only update locations from their company
  CREATE POLICY "locations_update_policy" ON public.locations
    FOR UPDATE
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

  -- DELETE: Users can only delete locations from their company
  CREATE POLICY "locations_delete_policy" ON public.locations
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = locations.company_id
          AND c.owner_id = auth.uid()
      )
    );

  RAISE NOTICE 'Locations RLS policies created successfully';
  RAISE NOTICE 'Users can now access locations from their company';
END $$;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'locations'
ORDER BY policyname;

