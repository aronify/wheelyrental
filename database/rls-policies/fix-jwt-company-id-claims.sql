-- ============================================================================
-- FIX JWT COMPANY_ID CLAIMS
-- ============================================================================
-- Adds company_id to auth.users.app_metadata for all users
-- This makes company_id available in auth.jwt() claims
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE FUNCTION TO SYNC COMPANY_ID TO APP_METADATA
-- ============================================================================
-- This function updates app_metadata.company_id when companies are created/updated

CREATE OR REPLACE FUNCTION public.sync_company_id_to_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's app_metadata with company_id
  -- This makes company_id available in JWT claims
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('company_id', NEW.id::text)
  WHERE id = NEW.owner_id;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: CREATE TRIGGER TO AUTO-SYNC ON COMPANY CREATION/UPDATE
-- ============================================================================
-- Automatically updates app_metadata when company owner_id is set/changed

DROP TRIGGER IF EXISTS trigger_sync_company_id_to_metadata ON public.companies;

CREATE TRIGGER trigger_sync_company_id_to_metadata
  AFTER INSERT OR UPDATE OF owner_id ON public.companies
  FOR EACH ROW
  WHEN (NEW.owner_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_company_id_to_user_metadata();

-- ============================================================================
-- STEP 3: BACKFILL EXISTING USERS
-- ============================================================================
-- Update app_metadata for all existing users who have companies

DO $$
DECLARE
  user_record RECORD;
  company_record RECORD;
BEGIN
  -- Loop through all companies and update their owners' app_metadata
  FOR company_record IN 
    SELECT id, owner_id 
    FROM public.companies 
    WHERE owner_id IS NOT NULL
  LOOP
    -- Update user's app_metadata with company_id
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('company_id', company_record.id::text)
    WHERE id = company_record.owner_id;
    
    RAISE NOTICE 'Updated app_metadata for user % with company_id %', 
      company_record.owner_id, company_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Backfilled app_metadata for all existing company owners';
END $$;

-- ============================================================================
-- STEP 4: VERIFY UPDATES
-- ============================================================================
-- Check that app_metadata now contains company_id

SELECT 
  'Verification' as step,
  u.id as user_id,
  u.email,
  c.id as company_id,
  c.name as company_name,
  u.raw_app_meta_data->>'company_id' as metadata_company_id,
  CASE 
    WHEN u.raw_app_meta_data->>'company_id' = c.id::text THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM auth.users u
INNER JOIN public.companies c ON c.owner_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

  RAISE NOTICE '✅ Fix complete!';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Users must RE-LOGIN to refresh their JWT tokens';
  RAISE NOTICE '2. After re-login, auth.jwt() ->> company_id will be available';
  RAISE NOTICE '3. RLS policies will then work correctly';
END $$;

-- ============================================================================
-- IMPORTANT: Users must re-login after running this script
-- ============================================================================
-- The JWT token is only refreshed on login
-- Existing sessions will not have company_id until users re-authenticate

