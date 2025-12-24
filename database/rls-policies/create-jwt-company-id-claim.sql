-- ============================================================================
-- CREATE CUSTOM JWT CLAIM FOR COMPANY_ID
-- ============================================================================
-- Supabase doesn't include app_metadata in JWT by default
-- We need a custom function that Supabase calls to add company_id to JWT
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE FUNCTION TO GET COMPANY_ID FROM USER
-- ============================================================================
-- This function will be called by Supabase to add company_id to JWT claims

CREATE OR REPLACE FUNCTION auth.get_user_company_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  company_id_val uuid;
BEGIN
  -- Get company_id from companies table where owner_id = user_id
  SELECT id INTO company_id_val
  FROM public.companies
  WHERE owner_id = user_id
  LIMIT 1;
  
  RETURN company_id_val;
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION auth.get_user_company_id(uuid) TO authenticated;

-- ============================================================================
-- STEP 2: ALTERNATIVE - USE USER_METADATA INSTEAD
-- ============================================================================
-- user_metadata IS included in JWT automatically
-- This is simpler than custom JWT claims
-- ============================================================================

-- Function to sync company_id to user_metadata (which IS in JWT)
CREATE OR REPLACE FUNCTION public.sync_company_id_to_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's user_metadata with company_id
  -- user_metadata IS included in JWT automatically
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('company_id', NEW.id::text)
  WHERE id = NEW.owner_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_company_id_to_user_metadata ON public.companies;

CREATE TRIGGER trigger_sync_company_id_to_user_metadata
  AFTER INSERT OR UPDATE OF owner_id ON public.companies
  FOR EACH ROW
  WHEN (NEW.owner_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_company_id_to_user_metadata();

-- ============================================================================
-- STEP 3: BACKFILL USER_METADATA FOR EXISTING USERS
-- ============================================================================

DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN 
    SELECT id, owner_id 
    FROM public.companies 
    WHERE owner_id IS NOT NULL
  LOOP
    -- Update user_metadata (included in JWT)
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('company_id', company_record.id::text)
    WHERE id = company_record.owner_id;
    
    RAISE NOTICE 'Updated user_metadata for user % with company_id %', 
      company_record.owner_id, company_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Backfilled user_metadata for all existing company owners';
END $$;

-- ============================================================================
-- STEP 4: UPDATE RLS POLICIES TO USE USER_METADATA
-- ============================================================================
-- user_metadata is accessible via auth.jwt() ->> 'user_metadata' ->> 'company_id'

DO $$
BEGIN
  -- Drop existing JWT-based policies
  DROP POLICY IF EXISTS "locations_select_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_insert_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_update_jwt" ON public.locations;
  DROP POLICY IF EXISTS "locations_delete_jwt" ON public.locations;

  -- SELECT: Use user_metadata.company_id from JWT
  CREATE POLICY "locations_select_jwt" ON public.locations
    FOR SELECT
    TO authenticated
    USING (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- INSERT: Use user_metadata.company_id from JWT
  CREATE POLICY "locations_insert_jwt" ON public.locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- UPDATE: Use user_metadata.company_id from JWT
  CREATE POLICY "locations_update_jwt" ON public.locations
    FOR UPDATE
    TO authenticated
    USING (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    )
    WITH CHECK (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  -- DELETE: Use user_metadata.company_id from JWT
  CREATE POLICY "locations_delete_jwt" ON public.locations
    FOR DELETE
    TO authenticated
    USING (
      locations.company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
    );

  RAISE NOTICE '✅ Updated RLS policies to use user_metadata.company_id';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check user_metadata
SELECT 
  u.id as user_id,
  u.email,
  c.id as company_id,
  u.raw_user_meta_data->>'company_id' as user_metadata_company_id,
  CASE 
    WHEN u.raw_user_meta_data->>'company_id' = c.id::text THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM auth.users u
INNER JOIN public.companies c ON c.owner_id = u.id
ORDER BY u.created_at DESC;

