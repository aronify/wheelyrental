-- ============================================================================
-- VIEW AND REMOVE OLD METADATA-BASED TRIGGERS
-- ============================================================================
-- These triggers are causing the error about company_id in raw_app_meta_data
-- We're now using owner_id column instead, so these need to be removed/updated
-- ============================================================================

-- STEP 1: View the problematic trigger functions
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
  'enforce_partner_company_ownership',
  'sync_company_id_to_user_metadata',
  'assign_partner_role_on_company_ownership',
  'current_user_company_id'
)
ORDER BY p.proname;

-- ============================================================================
-- STEP 2: Find which tables these triggers are on
-- ============================================================================
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  CASE 
    WHEN t.tgenabled = 'O' THEN '✅ ENABLED'
    WHEN t.tgenabled = 'D' THEN '❌ DISABLED'
    ELSE '⚠️ OTHER'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname IN (
  'enforce_partner_company_ownership',
  'sync_company_id_to_user_metadata',
  'assign_partner_role_on_company_ownership'
)
ORDER BY c.relname, t.tgname;
