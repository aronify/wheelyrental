-- ============================================================================
-- VERIFY LOCATIONS TABLE SCHEMA MATCHES CODE
-- ============================================================================
-- This script verifies that the locations table matches the expected schema
-- and that all code references are correct
-- ============================================================================

-- Verify table exists and has correct name
SELECT 
  'Table verification' as check_type,
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'locations';

-- Verify all required columns exist
SELECT 
  'Column verification' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'locations'
ORDER BY ordinal_position;

-- Verify constraints
SELECT 
  'Constraint verification' as check_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'locations';

-- Verify indexes
SELECT 
  'Index verification' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'locations';

-- Verify unique constraint on HQ (idx_company_locations_hq_unique)
SELECT 
  'HQ Unique Index' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'locations'
  AND indexname LIKE '%hq%';

-- Test query: Get locations for a company (replace with actual company_id)
-- SELECT 
--   id,
--   name,
--   company_id,
--   is_pickup,
--   is_dropoff,
--   is_hq,
--   is_active
-- FROM public.locations
-- WHERE company_id = 'YOUR_COMPANY_ID_HERE'
--   AND is_active = true
-- ORDER BY is_hq DESC, name ASC;

