-- ============================================================================
-- COMPREHENSIVE JWT RLS AUDIT AND FIX
-- ============================================================================
-- This script:
-- 1. Diagnoses JWT claim availability
-- 2. Classifies all tables into categories
-- 3. Fixes RLS defensively with proper fallbacks
-- 4. Validates the fix
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY JWT CLAIM AVAILABILITY
-- ============================================================================

DO $$
DECLARE
  jwt_company_id TEXT;
  jwt_user_id TEXT;
  current_user_id UUID;
BEGIN
  -- Check JWT claims
  jwt_company_id := auth.jwt() ->> 'company_id';
  jwt_user_id := auth.jwt() ->> 'sub';
  current_user_id := auth.uid();
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'JWT CLAIM DIAGNOSTICS';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Current User ID (auth.uid()): %', current_user_id;
  RAISE NOTICE 'JWT User ID (auth.jwt() ->> ''sub''): %', jwt_user_id;
  RAISE NOTICE 'JWT Company ID (auth.jwt() ->> ''company_id''): %', jwt_company_id;
  
  IF jwt_company_id IS NULL THEN
    RAISE NOTICE '⚠️  WARNING: company_id is NULL in JWT';
    RAISE NOTICE '   This means JWT-based RLS will fail for all tables';
    RAISE NOTICE '   Solution: Use defensive fallback to auth.uid() or company lookup';
  ELSE
    RAISE NOTICE '✅ company_id is present in JWT: %', jwt_company_id;
  END IF;
  
  RAISE NOTICE '============================================================================';
END $$;

-- Check user_metadata (where company_id should be synced)
SELECT 
  'User Metadata Check' as diagnostic_step,
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'company_id' as user_metadata_company_id,
  u.raw_app_meta_data->>'company_id' as app_metadata_company_id,
  c.id as company_id_from_companies,
  c.name as company_name,
  CASE 
    WHEN u.raw_user_meta_data->>'company_id' IS NOT NULL THEN '✅ user_metadata has company_id'
    WHEN u.raw_app_meta_data->>'company_id' IS NOT NULL THEN '⚠️  Only app_metadata has company_id (may not be in JWT)'
    ELSE '❌ No company_id in metadata'
  END as metadata_status
FROM auth.users u
LEFT JOIN public.companies c ON c.owner_id = u.id
WHERE u.id = auth.uid()
LIMIT 1;

-- ============================================================================
-- STEP 2: CLASSIFY TABLES
-- ============================================================================

-- Category A: Tables with company_id (should use JWT with fallback)
SELECT 
  'Category A: Tables with company_id' as category,
  table_name,
  'Use JWT with fallback to company lookup' as rls_strategy
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'company_id'
  )
  AND t.table_name != 'companies' -- companies is special
ORDER BY table_name;

-- Category B: Tables without company_id but user-owned (use auth.uid())
SELECT 
  'Category B: User-owned tables (no company_id)' as category,
  table_name,
  'Use auth.uid() ownership' as rls_strategy
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'company_id'
  )
  AND (
    EXISTS (
      SELECT 1 
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name IN ('user_id', 'owner_id')
    )
  )
ORDER BY table_name;

-- Category C: System/internal tables (should be locked down)
SELECT 
  'Category C: System tables' as category,
  table_name,
  'Backend-only or service_role only' as rls_strategy
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND table_name IN ('_prisma_migrations', 'schema_migrations')
ORDER BY table_name;

-- Special: companies table
SELECT 
  'Special: companies table' as category,
  'companies' as table_name,
  'Use JWT with fallback to owner_id lookup' as rls_strategy;

