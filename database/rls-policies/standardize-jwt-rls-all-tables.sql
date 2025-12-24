-- ============================================================================
-- STANDARDIZE JWT-BASED RLS ACROSS ALL COMPANY-OWNED TABLES
-- ============================================================================
-- Business Model: 1 user = 1 company
-- Ownership Rule: company_id = (auth.jwt() ->> 'company_id')::uuid
-- Companies Table: companies.id = (auth.jwt() ->> 'company_id')::uuid
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  policy_name TEXT;
  table_name_var TEXT;
  has_company_id BOOLEAN;
BEGIN
  -- STEP 1: Discover all tables with company_id OR the companies table itself
  FOR table_record IN
    SELECT 
      t.table_name,
      CASE 
        WHEN t.table_name = 'companies' THEN true
        ELSE EXISTS (
          SELECT 1 
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
            AND c.column_name = 'company_id'
        )
      END as has_company_id
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND (
        t.table_name = 'companies'
        OR EXISTS (
          SELECT 1 
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
            AND c.column_name = 'company_id'
        )
      )
    ORDER BY t.table_name
  LOOP
    table_name_var := table_record.table_name;
    has_company_id := table_record.has_company_id;
    
    RAISE NOTICE 'Processing table: %', table_name_var;
    
    -- STEP 2: Ensure RLS is enabled
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name_var);
    
    -- STEP 2b: Drop ALL existing policies (clean slate)
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name_var
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name_var);
      RAISE NOTICE '  Dropped policy: %', policy_name;
    END LOOP;
    
    -- STEP 3: Create standardized JWT-based policies
    IF table_name_var = 'companies' THEN
      -- Special case: companies table uses companies.id
      
      -- SELECT policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR SELECT
          TO authenticated
          USING (id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', 'companies_select_jwt', table_name_var);
      
      -- INSERT policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR INSERT
          TO authenticated
          WITH CHECK (id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', 'companies_insert_jwt', table_name_var);
      
      -- UPDATE policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR UPDATE
          TO authenticated
          USING (id = ((auth.jwt() ->> ''company_id'')::uuid))
          WITH CHECK (id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', 'companies_update_jwt', table_name_var);
      
      -- DELETE policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR DELETE
          TO authenticated
          USING (id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', 'companies_delete_jwt', table_name_var);
      
    ELSE
      -- Standard case: tables with company_id column
      
      -- SELECT policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR SELECT
          TO authenticated
          USING (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', table_name_var || '_select_jwt', table_name_var);
      
      -- INSERT policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR INSERT
          TO authenticated
          WITH CHECK (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', table_name_var || '_insert_jwt', table_name_var);
      
      -- UPDATE policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR UPDATE
          TO authenticated
          USING (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
          WITH CHECK (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', table_name_var || '_update_jwt', table_name_var);
      
      -- DELETE policy
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR DELETE
          TO authenticated
          USING (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
      ', table_name_var || '_delete_jwt', table_name_var);
      
    END IF;
    
    RAISE NOTICE '  Created JWT-based policies for: %', table_name_var;
    
    -- STEP 4: Fix grants
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name_var);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name_var);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public', table_name_var);
    
    RAISE NOTICE '  Fixed grants for: %', table_name_var;
    
  END LOOP;
  
  -- Ensure schema usage is granted
  GRANT USAGE ON SCHEMA public TO authenticated;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ JWT-based RLS standardized across all company-owned tables';
  RAISE NOTICE '✅ All policies use: company_id = (auth.jwt() ->> ''company_id'')::uuid';
  RAISE NOTICE '✅ Companies table uses: companies.id = (auth.jwt() ->> ''company_id'')::uuid';
  RAISE NOTICE '✅ Authenticated users can only access their company data';
  RAISE NOTICE '✅ anon/public users have NO access';
  RAISE NOTICE '============================================================================';
  
END $$;

-- ============================================================================
-- VERIFICATION: Check all policies and grants
-- ============================================================================

-- List all tables with JWT policies
SELECT 
  'Policy Summary' as check_type,
  tablename,
  COUNT(*) as policy_count,
  string_agg(cmd::text, ', ' ORDER BY cmd) as operations
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_jwt'
GROUP BY tablename
ORDER BY tablename;

-- Check grants for all company-owned tables
SELECT 
  'Grants Summary' as check_type,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon', 'public')
  AND table_name IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND (
        table_name = 'companies'
        OR EXISTS (
          SELECT 1 
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = tables.table_name
            AND c.column_name = 'company_id'
        )
      )
  )
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

