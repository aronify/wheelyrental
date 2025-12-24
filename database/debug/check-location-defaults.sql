-- ============================================================================
-- CHECK LOCATION TABLE DEFAULTS
-- ============================================================================
-- This script checks if the locations table has default values that might
-- be overriding the is_pickup and is_dropoff flags
-- ============================================================================

-- Check column defaults
SELECT 
  'Column Defaults' as check_type,
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'locations'
  AND column_name IN ('is_pickup', 'is_dropoff')
ORDER BY column_name;

-- Check actual data to see if both flags are being set to true
SELECT 
  'Location Flags Check' as check_type,
  id,
  name,
  is_pickup,
  is_dropoff,
  is_hq,
  CASE 
    WHEN is_pickup = true AND is_dropoff = true THEN 'Both true (HQ or dual-purpose)'
    WHEN is_pickup = true AND is_dropoff = false THEN 'Pickup only ✅'
    WHEN is_pickup = false AND is_dropoff = true THEN 'Dropoff only ✅'
    ELSE 'Neither (should not exist)'
  END as flag_status
FROM public.locations
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any triggers that might be modifying these values
SELECT 
  'Triggers Check' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'locations'
ORDER BY trigger_name;

