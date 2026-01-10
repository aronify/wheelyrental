-- ============================================================================
-- FIND WHERE THE ERROR IS COMING FROM (FIXED VERSION)
-- ============================================================================
-- Run this in Supabase SQL Editor to find triggers/functions that check metadata
-- ============================================================================

-- 1. Find all custom functions that mention company_id or metadata
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  '⚠️ CHECK THIS FUNCTION' as action
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
  AND p.proname NOT LIKE 'pg_%'
  AND (
    pg_get_functiondef(p.oid) LIKE '%company_id%'
    OR pg_get_functiondef(p.oid) LIKE '%meta_data%'
    OR pg_get_functiondef(p.oid) LIKE '%Partner%'
  )
ORDER BY n.nspname, p.proname;

-- 2. Get the FULL definition of suspicious functions
-- Run this for each function found above to see its code
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
  AND p.proname NOT LIKE 'pg_%'
  AND (
    pg_get_functiondef(p.oid) LIKE '%Partner users must have%'
    OR pg_get_functiondef(p.oid) LIKE '%raw_app_meta_data%'
  );

-- 3. Find all triggers and what functions they call
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
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.relname, t.tgname;

-- 4. Check for any functions that RAISE exceptions with our error message
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  substring(pg_get_functiondef(p.oid) from 1 for 500) as code_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%RAISE%'
  AND pg_get_functiondef(p.oid) LIKE '%Partner%'
ORDER BY n.nspname, p.proname;

-- 5. List ALL custom functions (to manually review)
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE 'gin_%'
ORDER BY n.nspname, p.proname;
