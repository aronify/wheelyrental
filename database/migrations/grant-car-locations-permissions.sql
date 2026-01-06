-- ============================================================================
-- GRANT PERMISSIONS ON car_locations TABLE
-- ============================================================================
-- 
-- This script grants necessary permissions to the authenticated and anon roles
-- to perform operations on the car_locations junction table.
--
-- Issue: Even with RLS disabled, PostgreSQL roles need explicit permissions
-- to perform INSERT, UPDATE, DELETE operations on tables.
--
-- Solution: Grant permissions to authenticated role (used by Supabase anon key)
-- ============================================================================

-- Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_locations TO authenticated;

-- Grant SELECT, INSERT, UPDATE, DELETE to anon role (fallback)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_locations TO anon;

-- Grant USAGE on the sequence (for auto-incrementing IDs if any)
-- Note: car_locations uses UUID, so this might not be needed, but included for completeness
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verification query (uncomment to verify):
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' 
--   AND table_name = 'car_locations'
--   AND grantee IN ('authenticated', 'anon');
-- Expected: authenticated and anon should have SELECT, INSERT, UPDATE, DELETE

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this script, the authenticated/anon roles will have permissions
-- to perform operations on car_locations. RLS policies will still enforce
-- company-based access control when enabled.
-- ============================================================================

