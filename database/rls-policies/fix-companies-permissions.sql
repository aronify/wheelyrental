-- ============================================================================
-- FIX PERMISSIONS FOR COMPANIES TABLE
-- Run this AFTER running the diagnostic script
-- ============================================================================

-- Grant ALL permissions to anon (for public access via anon key)
GRANT ALL ON TABLE public.companies TO anon;

-- Grant ALL permissions to authenticated (for logged-in users)
GRANT ALL ON TABLE public.companies TO authenticated;

-- Grant ALL permissions to service_role (for backend operations)
GRANT ALL ON TABLE public.companies TO service_role;

-- Verify grants were applied
SELECT 
  'Verification: Grants Applied' as status,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee
ORDER BY grantee;

