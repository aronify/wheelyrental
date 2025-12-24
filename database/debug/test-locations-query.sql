-- ============================================================================
-- TEST LOCATIONS TABLE QUERY (MATCHES CODE)
-- ============================================================================
-- This script tests the exact query used in getLocationsAction()
-- Use this to verify locations exist and match what the code expects
-- ============================================================================

-- Step 1: Verify table structure matches schema
SELECT 
  'Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'locations'
ORDER BY ordinal_position;

-- Step 2: Test query (REPLACE 'YOUR_COMPANY_ID_HERE' with actual company_id)
-- This is the EXACT query from getLocationsAction()
SELECT 
  id,
  name,
  city,
  address_line_1,
  is_pickup,
  is_dropoff,
  is_active,
  company_id,
  is_hq
FROM public.locations
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
  AND is_active = true
ORDER BY is_hq DESC, name ASC;

-- Step 3: Count locations by type for a company
SELECT 
  'Location Counts' as test_type,
  company_id,
  COUNT(*) as total_locations,
  COUNT(*) FILTER (WHERE is_pickup = true) as pickup_locations,
  COUNT(*) FILTER (WHERE is_dropoff = true) as dropoff_locations,
  COUNT(*) FILTER (WHERE is_hq = true) as hq_locations,
  COUNT(*) FILTER (WHERE is_active = true) as active_locations
FROM public.locations
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
GROUP BY company_id;

-- Step 4: List all locations for a company with details
SELECT 
  id,
  name,
  company_id,
  is_pickup,
  is_dropoff,
  is_hq,
  is_active,
  city,
  address_line_1,
  created_at
FROM public.locations
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
ORDER BY is_hq DESC, name ASC;

-- Step 5: Check for HQ location
SELECT 
  'HQ Location Check' as test_type,
  id,
  name,
  company_id,
  is_hq,
  is_pickup,
  is_dropoff,
  is_active
FROM public.locations
WHERE company_id = 'YOUR_COMPANY_ID_HERE'::uuid
  AND is_hq = true;

-- Step 6: Find company_id for a user (if you have user_id)
-- Replace 'YOUR_USER_ID_HERE' with actual user_id
SELECT 
  'Company for User' as test_type,
  c.id as company_id,
  c.name as company_name,
  c.owner_id as user_id
FROM public.companies c
WHERE c.owner_id = 'YOUR_USER_ID_HERE'::uuid;

-- Step 7: Full test - Get locations for user's company
-- Replace 'YOUR_USER_ID_HERE' with actual user_id
WITH user_company AS (
  SELECT id as company_id
  FROM public.companies
  WHERE owner_id = 'YOUR_USER_ID_HERE'::uuid
  LIMIT 1
)
SELECT 
  l.id,
  l.name,
  l.city,
  l.address_line_1,
  l.is_pickup,
  l.is_dropoff,
  l.is_hq,
  l.is_active,
  l.company_id
FROM public.locations l
CROSS JOIN user_company uc
WHERE l.company_id = uc.company_id
  AND l.is_active = true
ORDER BY l.is_hq DESC, l.name ASC;

