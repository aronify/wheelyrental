-- ============================================================================
-- FIX HQ LOCATION NAME FORMAT
-- ============================================================================
-- Change from "Company Name Headquarters" to "HQ - Company Name"
-- Updates both triggers and existing locations
-- ============================================================================

-- STEP 1: Update existing HQ locations to use "HQ - " format
UPDATE public.locations
SET name = 'HQ - ' || TRIM(REPLACE(REPLACE(name, ' Headquarters', ''), 'Headquarters', ''))
WHERE is_hq = true
  AND (name LIKE '%Headquarters%' OR name LIKE '%headquarters%');

-- STEP 2: Update trigger function to use "HQ - " format
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'sync_company_to_headquarters_location'
  ) THEN
    -- Use EXECUTE for dynamic SQL
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.sync_company_to_headquarters_location()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    BEGIN
      IF TG_OP = ''INSERT'' OR
         (OLD.address IS DISTINCT FROM NEW.address) OR
         (OLD.city IS DISTINCT FROM NEW.city) OR
         (OLD.country IS DISTINCT FROM NEW.country) OR
         (OLD.postal_code IS DISTINCT FROM NEW.postal_code) OR
         (OLD.name IS DISTINCT FROM NEW.name) THEN
        
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = ''public'' 
          AND table_name = ''locations''
        ) THEN
          IF EXISTS (
            SELECT 1 FROM public.locations
            WHERE company_id = NEW.id AND is_hq = true
          ) THEN
            UPDATE public.locations
            SET
              name = ''HQ - '' || NEW.name,
              address_line_1 = COALESCE(NEW.address, locations.address_line_1),
              city = COALESCE(NEW.city, locations.city),
              country = COALESCE(NEW.country, locations.country, ''Albania''),
              postal_code = COALESCE(NEW.postal_code, locations.postal_code),
              updated_at = NOW()
            WHERE company_id = NEW.id AND is_hq = true;
          ELSE
            IF NEW.address IS NOT NULL OR NEW.city IS NOT NULL THEN
              INSERT INTO public.locations (
                company_id, name, address_line_1, city, country, postal_code,
                is_pickup, is_dropoff, is_hq, is_active
              ) VALUES (
                NEW.id, ''HQ - '' || NEW.name, NEW.address, NEW.city,
                COALESCE(NEW.country, ''Albania''), NEW.postal_code,
                true, true, true, true
              )
              ON CONFLICT DO NOTHING;
            END IF;
          END IF;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $func$;';
    
    RAISE NOTICE '✅ Updated sync_company_to_headquarters_location to use "HQ - " format';
  END IF;
END $$;

-- STEP 3: Verify existing HQ locations
SELECT 
  'HQ Locations Check' as check_type,
  id,
  name,
  company_id,
  CASE 
    WHEN name LIKE 'HQ - %' THEN '✅ Correct format'
    WHEN name LIKE '%Headquarters%' THEN '❌ Wrong format (needs update)'
    ELSE '⚠️ Other format'
  END as format_status
FROM public.locations
WHERE is_hq = true
ORDER BY created_at DESC;
