-- ============================================================================
-- DEFENSIVE JWT RLS FIX - COMPLETE SOLUTION
-- ============================================================================
-- This script fixes RLS for all tables with defensive fallbacks
-- - JWT-based where valid
-- - Falls back to auth.uid() or company lookup when JWT is NULL
-- - No silent failures
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  policy_name TEXT;
  table_name_var TEXT;
  has_company_id BOOLEAN;
  has_user_id BOOLEAN;
  has_owner_id BOOLEAN;
  user_id_column TEXT;
BEGIN
  -- Process all public tables
  FOR table_record IN
    SELECT 
      t.table_name,
      EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
          AND c.column_name = 'company_id'
      ) as has_company_id,
      EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
          AND c.column_name = 'user_id'
      ) as has_user_id,
      EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
          AND c.column_name = 'owner_id'
      ) as has_owner_id
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE 'pg_%'
      AND t.table_name NOT LIKE '_prisma%'
    ORDER BY t.table_name
  LOOP
    table_name_var := table_record.table_name;
    has_company_id := table_record.has_company_id;
    has_user_id := table_record.has_user_id;
    has_owner_id := table_record.has_owner_id;
    
    -- Determine user_id column
    IF has_user_id THEN
      user_id_column := 'user_id';
    ELSIF has_owner_id THEN
      user_id_column := 'owner_id';
    ELSE
      user_id_column := NULL;
    END IF;
    
    RAISE NOTICE 'Processing table: % (company_id: %, user_column: %)', 
      table_name_var, has_company_id, user_id_column;
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name_var);
    
    -- Drop ALL existing policies
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name_var
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name_var);
    END LOOP;
    
    -- ========================================================================
    -- CATEGORY A: Tables with company_id (JWT with defensive fallback)
    -- ========================================================================
    IF has_company_id THEN
      IF table_name_var = 'companies' THEN
        -- Special case: companies table uses companies.id
        -- Fallback: Check owner_id = auth.uid() if JWT is NULL
        
        -- SELECT: JWT OR owner_id fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR SELECT TO authenticated
            USING (
              -- Primary: JWT-based
              (id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              -- Fallback: owner_id lookup (if JWT is NULL)
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND owner_id = auth.uid()
              )
            )
        ', table_name_var || '_select_defensive', table_name_var);
        
        -- INSERT: JWT OR owner_id fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR INSERT TO authenticated
            WITH CHECK (
              (id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND owner_id = auth.uid()
              )
            )
        ', table_name_var || '_insert_defensive', table_name_var);
        
        -- UPDATE: JWT OR owner_id fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR UPDATE TO authenticated
            USING (
              (id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND owner_id = auth.uid()
              )
            )
            WITH CHECK (
              (id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND owner_id = auth.uid()
              )
            )
        ', table_name_var || '_update_defensive', table_name_var);
        
        -- DELETE: JWT OR owner_id fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR DELETE TO authenticated
            USING (
              (id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND owner_id = auth.uid()
              )
            )
        ', table_name_var || '_delete_defensive', table_name_var);
        
      ELSE
        -- Standard tables with company_id
        -- Fallback: Lookup company via owner_id if JWT is NULL
        -- Note: In USING/WITH CHECK, the table is implicitly referenced
        
        -- SELECT: JWT OR company lookup fallback
        -- In RLS USING clause, columns are referenced directly (no table prefix needed)
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR SELECT TO authenticated
            USING (
              -- Primary: JWT-based
              (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              -- Fallback: Company lookup via owner_id (when JWT is NULL)
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND EXISTS (
                  SELECT 1 
                  FROM public.companies c 
                  WHERE c.id = company_id 
                  AND c.owner_id = auth.uid()
                )
              )
            )
        ', table_name_var || '_select_defensive', table_name_var);
        
        -- INSERT: JWT OR company lookup fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR INSERT TO authenticated
            WITH CHECK (
              (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND EXISTS (
                  SELECT 1 
                  FROM public.companies c 
                  WHERE c.id = company_id 
                  AND c.owner_id = auth.uid()
                )
              )
            )
        ', table_name_var || '_insert_defensive', table_name_var);
        
        -- UPDATE: JWT OR company lookup fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR UPDATE TO authenticated
            USING (
              (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND EXISTS (
                  SELECT 1 
                  FROM public.companies c 
                  WHERE c.id = company_id 
                  AND c.owner_id = auth.uid()
                )
              )
            )
            WITH CHECK (
              (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND EXISTS (
                  SELECT 1 
                  FROM public.companies c 
                  WHERE c.id = company_id 
                  AND c.owner_id = auth.uid()
                )
              )
            )
        ', table_name_var || '_update_defensive', table_name_var);
        
        -- DELETE: JWT OR company lookup fallback
        EXECUTE format('
          CREATE POLICY %I ON public.%I
            FOR DELETE TO authenticated
            USING (
              (company_id = ((auth.jwt() ->> ''company_id'')::uuid))
              OR
              (
                (auth.jwt() ->> ''company_id'') IS NULL
                AND EXISTS (
                  SELECT 1 
                  FROM public.companies c 
                  WHERE c.id = company_id 
                  AND c.owner_id = auth.uid()
                )
              )
            )
        ', table_name_var || '_delete_defensive', table_name_var);
      END IF;
      
    -- ========================================================================
    -- CATEGORY B: Tables without company_id (use auth.uid())
    -- ========================================================================
    ELSIF user_id_column IS NOT NULL THEN
      -- User-owned tables: profiles, customers, etc.
      
      -- SELECT
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR SELECT TO authenticated
          USING (%I = auth.uid())
      ', table_name_var || '_select_user', table_name_var, user_id_column);
      
      -- INSERT
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR INSERT TO authenticated
          WITH CHECK (%I = auth.uid())
      ', table_name_var || '_insert_user', table_name_var, user_id_column);
      
      -- UPDATE
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR UPDATE TO authenticated
          USING (%I = auth.uid())
          WITH CHECK (%I = auth.uid())
      ', table_name_var || '_update_user', table_name_var, user_id_column, user_id_column);
      
      -- DELETE
      EXECUTE format('
        CREATE POLICY %I ON public.%I
          FOR DELETE TO authenticated
          USING (%I = auth.uid())
      ', table_name_var || '_delete_user', table_name_var, user_id_column);
      
    -- ========================================================================
    -- CATEGORY C: Tables without ownership columns
    -- ========================================================================
    ELSE
      -- Check if this is a junction/helper table that might need special handling
      -- For now, lock down completely - no frontend access
      RAISE NOTICE '  ⚠️  Table % has no ownership columns - locking down', table_name_var;
      
      -- No policies = no access for authenticated/anon
      -- service_role retains full access via default grants
      -- If this table needs access, add explicit policies above
    END IF;
    
    -- ========================================================================
    -- FIX GRANTS
    -- ========================================================================
    IF has_company_id OR user_id_column IS NOT NULL THEN
      -- Grant to authenticated
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name_var);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name_var);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public', table_name_var);
    ELSE
      -- Lock down: revoke from authenticated and anon
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', table_name_var);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name_var);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public', table_name_var);
    END IF;
    
    RAISE NOTICE '  ✅ Fixed policies and grants for: %', table_name_var;
    
  END LOOP;
  
  -- Ensure schema usage
  GRANT USAGE ON SCHEMA public TO authenticated;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ DEFENSIVE RLS FIX COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Tables with company_id: Use JWT with fallback to company lookup';
  RAISE NOTICE 'Tables with user_id/owner_id: Use auth.uid() ownership';
  RAISE NOTICE 'Tables without ownership: Locked down (backend-only)';
  RAISE NOTICE 'All policies work even if JWT company_id is NULL';
  RAISE NOTICE '============================================================================';
  
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all policies by table
SELECT 
  'Policy Summary' as check_type,
  tablename,
  COUNT(*) as policy_count,
  string_agg(DISTINCT cmd::text, ', ' ORDER BY cmd) as operations
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check grants
SELECT 
  'Grants Summary' as check_type,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon', 'public')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

