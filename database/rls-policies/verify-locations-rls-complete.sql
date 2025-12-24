-- ============================================================================
-- VERIFY LOCATIONS RLS IS COMPLETE
-- ============================================================================
-- Run this to verify everything is set up correctly
-- ============================================================================

-- 1. Check RLS is enabled
SELECT 
  'RLS Status' as check_type,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'locations';

-- 2. Check policies exist
SELECT 
  'Policies' as check_type,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) = 4 THEN '✅ All 4 policies exist' ELSE '❌ Missing policies' END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'locations';

-- 3. Check trigger exists for auto-sync
SELECT 
  'Trigger Status' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  CASE WHEN trigger_name IS NOT NULL THEN '✅ Trigger exists' ELSE '❌ No trigger' END as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'companies'
  AND trigger_name LIKE '%sync_company_id%';

-- 4. Check function exists
SELECT 
  'Function Status' as check_type,
  routine_name,
  routine_type,
  CASE WHEN routine_name IS NOT NULL THEN '✅ Function exists' ELSE '❌ No function' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'sync_company_id_to_user_metadata';

-- 5. Summary
SELECT 
  'Summary' as check_type,
  'If all checks show ✅, everything is set up correctly!' as message;

