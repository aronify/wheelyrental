-- ============================================================================
-- VALIDATE RLS FIX (SAFE VERSION - ONLY QUERIES EXISTING TABLES)
-- ============================================================================
-- Run this as an authenticated user to verify RLS is working correctly
-- This version only queries tables that actually exist
-- ============================================================================

-- Test 1: Verify JWT claim availability
SELECT 
  'Test 1: JWT Claims' as test_name,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'company_id' as jwt_company_id,
  CASE 
    WHEN auth.jwt() ->> 'company_id' IS NOT NULL THEN '✅ JWT has company_id'
    ELSE '⚠️  JWT missing company_id (will use fallback)'
  END as jwt_status;

-- Test 2: Verify company lookup fallback works
SELECT 
  'Test 2: Company Lookup' as test_name,
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ User owns this company'
    ELSE '❌ User does NOT own this company'
  END as ownership_status
FROM public.companies c
WHERE c.owner_id = auth.uid()
LIMIT 1;

-- Test 3: Test visibility of tables with company_id (only if they exist)
-- This dynamically checks which tables exist before querying

DO $$
DECLARE
  table_record RECORD;
  table_name_var TEXT;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TEST 3: Testing visibility of tables with company_id';
  RAISE NOTICE '============================================================================';
  
  -- Check each table that might have company_id
  FOR table_record IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('companies', 'locations', 'cars', 'bookings', 'car_blocks', 'reviews')
      AND EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = tables.table_name
          AND c.column_name = 'company_id'
      )
    ORDER BY table_name
  LOOP
    table_name_var := table_record.table_name;
    
    BEGIN
      -- Dynamically query the table
      EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name_var) INTO row_count;
      
      RAISE NOTICE 'Table: % | Visible rows: % | Status: %', 
        table_name_var, 
        row_count,
        CASE WHEN row_count > 0 THEN '✅ Data visible' ELSE '❌ No data visible' END;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Table: % | Error: %', table_name_var, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '============================================================================';
END $$;

-- Test 4: Test visibility of user-owned tables (only if they exist)
DO $$
DECLARE
  table_record RECORD;
  table_name_var TEXT;
  user_id_column TEXT;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TEST 4: Testing visibility of user-owned tables';
  RAISE NOTICE '============================================================================';
  
  -- Check tables that might have user_id or owner_id
  FOR table_record IN
    SELECT 
      t.table_name,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_id'
        ) THEN 'user_id'
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'owner_id'
        ) THEN 'owner_id'
        ELSE NULL
      END as user_column
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name IN ('profiles', 'customers', 'payout_requests', 'user_companies')
      AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
          AND c.column_name = 'company_id'
      )
    ORDER BY t.table_name
  LOOP
    table_name_var := table_record.table_name;
    user_id_column := table_record.user_column;
    
    IF user_id_column IS NOT NULL THEN
      BEGIN
        -- Dynamically query the table with user filter
        EXECUTE format(
          'SELECT COUNT(*) FROM public.%I WHERE %I = $1',
          table_name_var,
          user_id_column
        ) USING auth.uid() INTO row_count;
        
        RAISE NOTICE 'Table: % | Visible rows: % | Status: %', 
          table_name_var, 
          row_count,
          CASE WHEN row_count > 0 THEN '✅ Data visible' ELSE '❌ No data visible' END;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Table: % | Error: %', table_name_var, SQLERRM;
      END;
    END IF;
  END LOOP;
  
  RAISE NOTICE '============================================================================';
END $$;

-- Test 5: Verify anon has NO access (should return 0 rows)
-- This test should be run as anon role to verify
SELECT 
  'Test 5: Anon Access Check' as test_name,
  'Run this query as anon role' as instruction,
  'If any rows are visible, RLS is broken' as warning;

-- Test 6: Policy verification
SELECT 
  'Test 6: Policy Verification' as test_name,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Test 7: Summary of all tables and their RLS status
SELECT 
  'Test 7: Table RLS Summary' as test_name,
  t.table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.schemaname = 'public' 
      AND p.tablename = t.table_name
    ) THEN '✅ Has RLS policies'
    ELSE '❌ No RLS policies'
  END as rls_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name = 'company_id'
    ) THEN 'Has company_id'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name IN ('user_id', 'owner_id')
    ) THEN 'Has user_id/owner_id'
    ELSE 'No ownership column'
  END as ownership_type
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE '_prisma%'
ORDER BY t.table_name;

