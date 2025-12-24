-- ============================================================================
-- TEST JWT IN APP CONTEXT (Run from your app, not SQL Editor)
-- ============================================================================
-- This query should be run from your Next.js app where you're authenticated
-- NOT from Supabase SQL Editor (which runs as service_role)
-- ============================================================================

-- When run from your app (authenticated context), this should return:
-- - user_id: your actual user ID
-- - company_id_from_jwt: your company_id from JWT
-- - If null, you need to re-login

SELECT 
  auth.uid() as user_id,
  auth.jwt() -> 'user_metadata' ->> 'company_id' as company_id_from_jwt,
  auth.jwt() -> 'user_metadata' as full_user_metadata,
  CASE 
    WHEN auth.jwt() -> 'user_metadata' ->> 'company_id' IS NULL THEN '❌ MISSING - Re-login required'
    ELSE '✅ EXISTS: ' || (auth.jwt() -> 'user_metadata' ->> 'company_id')
  END as status;

