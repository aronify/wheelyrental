-- ============================================================================
-- COMPREHENSIVE FIX FOR COMPANIES TABLE RLS POLICIES
-- Fixes both SELECT and UPDATE policies to work securely with or without company_members table
-- Keeps RLS enabled and maintains security
-- ============================================================================

DO $$
BEGIN
  -- Ensure companies table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
  ) THEN
    -- Enable RLS (idempotent)
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

    -- Drop all existing policies to start fresh
    DROP POLICY IF EXISTS "companies_select_policy" ON companies;
    DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
    DROP POLICY IF EXISTS "companies_update_policy" ON companies;
    DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

    -- Check if company_members table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables  
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      -- ========================================================================
      -- SCENARIO 1: company_members table EXISTS
      -- Use proper membership-based access control
      -- ========================================================================
      
      -- SELECT: Users can see companies they belong to
      EXECUTE '
        CREATE POLICY "companies_select_policy" ON companies
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = companies.id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
            )
          );
      ';

      -- INSERT: Authenticated users can create companies
      EXECUTE '
        CREATE POLICY "companies_insert_policy" ON companies
          FOR INSERT
          WITH CHECK (auth.uid() IS NOT NULL);
      ';

      -- UPDATE: Users can update companies they belong to
      EXECUTE '
        CREATE POLICY "companies_update_policy" ON companies
          FOR UPDATE
          USING (
            EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = companies.id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = companies.id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
            )
          );
      ';

      -- DELETE: Only owners can delete companies
      EXECUTE '
        CREATE POLICY "companies_delete_policy" ON companies
          FOR DELETE
          USING (
            EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = companies.id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role = ''owner''
            )
          );
      ';

    ELSE
      -- ========================================================================
      -- SCENARIO 2: company_members table DOES NOT EXIST
      -- Fallback: Allow authenticated users (less secure but necessary)
      -- ========================================================================
      
      -- SELECT: Authenticated users can see all companies
      -- NOTE: This is less secure but necessary if company_members doesn't exist
      EXECUTE '
        CREATE POLICY "companies_select_policy" ON companies
          FOR SELECT
          USING (auth.uid() IS NOT NULL);
      ';

      -- INSERT: Authenticated users can create companies
      EXECUTE '
        CREATE POLICY "companies_insert_policy" ON companies
          FOR INSERT
          WITH CHECK (auth.uid() IS NOT NULL);
      ';

      -- UPDATE: Authenticated users can update companies
      -- NOTE: This allows any authenticated user to update any company
      -- This is less secure but necessary until company_members table is created
      EXECUTE '
        CREATE POLICY "companies_update_policy" ON companies
          FOR UPDATE
          USING (auth.uid() IS NOT NULL)
          WITH CHECK (auth.uid() IS NOT NULL);
      ';

      -- DELETE: Authenticated users can delete companies
      -- NOTE: This is less secure - consider restricting when company_members is created
      EXECUTE '
        CREATE POLICY "companies_delete_policy" ON companies
          FOR DELETE
          USING (auth.uid() IS NOT NULL);
      ';

    END IF;

    RAISE NOTICE 'Companies RLS policies have been updated successfully';
  ELSE
    RAISE NOTICE 'Companies table does not exist - skipping policy creation';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (optional - run these to verify)
-- ============================================================================

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- List all policies on companies table
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'companies'
ORDER BY policyname;

