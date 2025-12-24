-- ============================================================================
-- DEBUG: LOCATIONS TABLE - MATCHES CODE LOGIC EXACTLY
-- ============================================================================
-- This script replicates the exact query logic from getLocationsAction()
-- Use this to verify why locations aren't displaying
-- ============================================================================

-- STEP 1: Get company_id for a user (replace USER_ID_HERE)
-- This matches the code logic in getLocationsAction()
DO $$
DECLARE
  v_user_id uuid := 'USER_ID_HERE'::uuid; -- REPLACE WITH ACTUAL USER ID
  v_company_id uuid;
  v_location_count integer;
BEGIN
  -- Method 1: Direct query (matches code)
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE owner_id = v_user_id
  LIMIT 1;
  
  RAISE NOTICE 'Company ID from companies.owner_id: %', v_company_id;
  
  -- If no company found, try fallback (matches code)
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id
    FROM public.cars
    LIMIT 1;
    
    RAISE NOTICE 'Company ID from cars fallback: %', v_company_id;
  END IF;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company_id found for user %', v_user_id;
  END IF;
  
  -- STEP 2: Check if HQ location exists (matches ensureHqLocation function)
  SELECT COUNT(*) INTO v_location_count
  FROM public.locations
  WHERE company_id = v_company_id
    AND is_hq = true;
  
  RAISE NOTICE 'HQ locations found: %', v_location_count;
  
  -- STEP 3: Execute the EXACT query from getLocationsAction()
  -- This is what the code runs
  PERFORM id, name, city, address_line_1, is_pickup, is_dropoff, is_active, company_id, is_hq
  FROM public.locations
  WHERE company_id = v_company_id
    AND is_active = true
  ORDER BY is_hq DESC, name ASC;
  
  RAISE NOTICE 'Query executed successfully for company_id: %', v_company_id;
  
END $$;

-- STEP 4: Show actual query results (replace COMPANY_ID_HERE)
-- This is the EXACT query the code uses
SELECT 
  id,
  name,
  city,
  address_line_1,
  is_pickup,
  is_dropoff,
  is_active,
  company_id,
  is_hq,
  -- Show what the code will map these to
  CASE WHEN is_pickup THEN true ELSE false END as will_be_pickup_location,
  CASE WHEN is_dropoff THEN true ELSE false END as will_be_dropoff_location
FROM public.locations
WHERE company_id = 'COMPANY_ID_HERE'::uuid  -- REPLACE WITH ACTUAL COMPANY ID
  AND is_active = true
ORDER BY is_hq DESC, name ASC;

-- STEP 5: Verify data types and values
SELECT 
  'Data Type Check' as check_type,
  id,
  name,
  is_pickup::text as is_pickup_text,
  is_pickup::boolean as is_pickup_bool,
  is_dropoff::text as is_dropoff_text,
  is_dropoff::boolean as is_dropoff_bool,
  is_active::text as is_active_text,
  is_hq::text as is_hq_text
FROM public.locations
WHERE company_id = 'COMPANY_ID_HERE'::uuid  -- REPLACE WITH ACTUAL COMPANY ID
LIMIT 5;

-- STEP 6: Check for common issues
SELECT 
  'Issue Detection' as check_type,
  COUNT(*) as total_locations,
  COUNT(*) FILTER (WHERE is_pickup = false AND is_dropoff = false) as invalid_locations,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_locations,
  COUNT(*) FILTER (WHERE is_pickup IS NULL) as null_pickup,
  COUNT(*) FILTER (WHERE is_dropoff IS NULL) as null_dropoff
FROM public.locations
WHERE company_id = 'COMPANY_ID_HERE'::uuid;  -- REPLACE WITH ACTUAL COMPANY ID

