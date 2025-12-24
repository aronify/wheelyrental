-- ============================================================================
-- CLEANUP DUPLICATE TRIGGERS
-- ============================================================================
-- Remove old trigger, keep only the correct one
-- ============================================================================

-- Drop the old trigger (if it exists)
DROP TRIGGER IF EXISTS trigger_sync_company_id_to_metadata ON public.companies;

-- Keep only the correct trigger: trigger_sync_company_id_to_user_metadata
-- This one syncs to user_metadata (which is in JWT)

-- Verify only one trigger exists
SELECT 
  'Trigger Cleanup' as check_type,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'companies'
  AND trigger_name LIKE '%sync_company_id%'
ORDER BY trigger_name;

-- Expected: Only "trigger_sync_company_id_to_user_metadata" should exist

