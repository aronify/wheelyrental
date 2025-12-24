-- ============================================================================
-- COMPREHENSIVE FIX FOR COMPANIES TABLE PERMISSIONS & TRIGGERS
-- Fixes "permission denied" errors caused by triggers running as INVOKER
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY WHAT THE TRIGGERS TOUCH
-- ============================================================================

-- Check update_updated_at_column function
SELECT 
  'STEP 1a: update_updated_at_column function' as diagnostic_step,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition,
  p.prosecdef as is_security_definer,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER (good)'
    ELSE 'SECURITY INVOKER (needs fix)'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'update_updated_at_column';

-- Check sync_company_to_headquarters_location function
SELECT 
  'STEP 1b: sync_company_to_headquarters_location function' as diagnostic_step,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition,
  p.prosecdef as is_security_definer,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER (good)'
    ELSE 'SECURITY INVOKER (needs fix)'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'sync_company_to_headquarters_location';

-- List all triggers on companies table
SELECT 
  'STEP 1c: Triggers on companies' as diagnostic_step,
  tgname as trigger_name,
  tgenabled as trigger_enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'public.companies'::regclass
  AND tgisinternal = false;

-- ============================================================================
-- STEP 2: CHECK ROLE PERMISSIONS (NOT RLS)
-- ============================================================================

-- Check GRANTS on companies table
SELECT 
  'STEP 2a: GRANTS on companies' as diagnostic_step,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Check GRANTS on company_locations (likely touched by sync trigger)
SELECT 
  'STEP 2b: GRANTS on company_locations' as diagnostic_step,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'company_locations'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Check GRANTS on locations (alternative table name)
SELECT 
  'STEP 2c: GRANTS on locations' as diagnostic_step,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'locations'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- ============================================================================
-- STEP 3: APPLY THE CORRECT FIX (SECURE)
-- ============================================================================

-- Grant permissions to authenticated role (for logged-in users)
GRANT SELECT, INSERT, UPDATE ON TABLE public.companies TO authenticated;

-- Grant permissions to anon role (SELECT only, no writes)
GRANT SELECT ON TABLE public.companies TO anon;

-- Grant full access to service_role (for backend operations)
GRANT ALL ON TABLE public.companies TO service_role;

-- Grant usage on sequences (for default id generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on company_locations if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_locations'
  ) THEN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.company_locations TO authenticated;
    GRANT ALL ON TABLE public.company_locations TO service_role;
  END IF;
END $$;

-- Grant permissions on locations if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'locations'
  ) THEN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.locations TO authenticated;
    GRANT ALL ON TABLE public.locations TO service_role;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: FIX TRIGGERS PROPERLY (MANDATORY)
-- ============================================================================

-- Fix update_updated_at_column to SECURITY DEFINER
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_updated_at_column'
  ) THEN
    -- Recreate function with SECURITY DEFINER
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $func$;
    ';
  END IF;
END $$;

-- Fix sync_company_to_headquarters_location to SECURITY DEFINER
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'sync_company_to_headquarters_location'
  ) THEN
    -- Recreate function with SECURITY DEFINER (matches original implementation)
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.sync_company_to_headquarters_location()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      BEGIN
        -- Only proceed if address-related fields changed (or on INSERT)
        IF TG_OP = ''INSERT'' OR
           (OLD.address IS DISTINCT FROM NEW.address) OR
           (OLD.city IS DISTINCT FROM NEW.city) OR
           (OLD.country IS DISTINCT FROM NEW.country) OR
           (OLD.postal_code IS DISTINCT FROM NEW.postal_code) OR
           (OLD.name IS DISTINCT FROM NEW.name) THEN
          
          -- Check if company_locations table exists
          IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = ''public'' 
            AND table_name = ''company_locations''
          ) THEN
            -- Check if headquarters location exists
            IF EXISTS (
              SELECT 1 FROM public.company_locations
              WHERE company_id = NEW.id
                AND is_hq = true
            ) THEN
              -- Update existing headquarters location
              UPDATE public.company_locations
              SET
                name = COALESCE(NEW.name || '' Headquarters'', company_locations.name),
                address_line_1 = COALESCE(NEW.address, company_locations.address_line_1),
                city = COALESCE(NEW.city, company_locations.city),
                country = COALESCE(NEW.country, company_locations.country, ''Albania''),
                postal_code = COALESCE(NEW.postal_code, company_locations.postal_code),
                updated_at = NOW()
              WHERE company_id = NEW.id
                AND is_hq = true;
            ELSE
              -- Create new headquarters location if address is provided
              IF NEW.address IS NOT NULL OR NEW.city IS NOT NULL THEN
                INSERT INTO public.company_locations (
                  company_id,
                  name,
                  address_line_1,
                  city,
                  country,
                  postal_code,
                  is_pickup,
                  is_dropoff,
                  is_hq,
                  is_active
                )
                VALUES (
                  NEW.id,
                  COALESCE(NEW.name, ''Company'') || '' Headquarters'',
                  NEW.address,
                  NEW.city,
                  COALESCE(NEW.country, ''Albania''),
                  NEW.postal_code,
                  true,
                  true,
                  true,
                  true
                )
                ON CONFLICT DO NOTHING;
              END IF;
            END IF;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $func$;
    ';
  END IF;
END $$;

-- Ensure trigger functions are owned by a privileged role
DO $$
DECLARE
  v_owner_role TEXT := 'postgres';
BEGIN
  -- Try to set owner to postgres, fallback to supabase_admin
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    v_owner_role := 'postgres';
  ELSIF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    v_owner_role := 'supabase_admin';
  END IF;
  
  -- Change ownership of trigger functions
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE format('ALTER FUNCTION public.update_updated_at_column() OWNER TO %I', v_owner_role);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'sync_company_to_headquarters_location'
  ) THEN
    EXECUTE format('ALTER FUNCTION public.sync_company_to_headquarters_location() OWNER TO %I', v_owner_role);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: VERIFY
-- ============================================================================

-- Verify function security settings
SELECT 
  'STEP 5a: Function Security Verification' as verification_step,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  pg_get_userbyid(p.proowner) as function_owner,
  CASE 
    WHEN p.prosecdef THEN '✓ SECURITY DEFINER'
    ELSE '✗ SECURITY INVOKER (needs fix)'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('update_updated_at_column', 'sync_company_to_headquarters_location')
ORDER BY p.proname;

-- Verify GRANTS on companies
SELECT 
  'STEP 5b: GRANTS Verification' as verification_step,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions,
  CASE 
    WHEN grantee = 'authenticated' AND 'UPDATE' = ANY(string_to_array(string_agg(privilege_type, ','), ', ')) THEN '✓ authenticated can UPDATE'
    WHEN grantee = 'authenticated' THEN '✗ authenticated missing UPDATE'
    WHEN grantee = 'anon' AND 'SELECT' = ANY(string_to_array(string_agg(privilege_type, ','), ', ')) THEN '✓ anon can SELECT only'
    WHEN grantee = 'service_role' THEN '✓ service_role has full access'
    ELSE 'Check required'
  END as status
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee
ORDER BY grantee;

-- Verify current user context
SELECT 
  'STEP 5c: Current Role Context' as verification_step,
  current_user as current_database_user,
  session_user as session_database_user,
  current_setting('request.jwt.claims', true)::json->>'role' as jwt_role;

-- Final status summary
SELECT 
  'STEP 5d: Final Status' as verification_step,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'update_updated_at_column'
        AND p.prosecdef = true
    ) AND EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'sync_company_to_headquarters_location'
        AND p.prosecdef = true
    ) AND EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
    ) THEN '✓ ALL FIXES APPLIED - Updates should work now'
    ELSE '✗ Some fixes may be missing - check above'
  END as overall_status;

