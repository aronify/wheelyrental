-- Comprehensive fix for companies UPDATE policy with better error handling
-- This version ensures the policy works correctly

DO $$
BEGIN
  -- Check if companies table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
  ) THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "companies_update_policy" ON companies;

    -- Check if company_members table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      -- Ensure user_has_company_access function exists
      IF EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'user_has_company_access'
      ) THEN
        -- Create policy using the helper function
        EXECUTE '
          CREATE POLICY "companies_update_policy" ON companies
            FOR UPDATE
            USING (
              public.user_has_company_access(id)
            )
            WITH CHECK (
              public.user_has_company_access(id)
            );
        ';
      ELSE
        -- Fallback: Create policy without helper function
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
      END IF;
    ELSE
      -- Fallback: Allow authenticated users if company_members doesn't exist
      EXECUTE '
        CREATE POLICY "companies_update_policy" ON companies
          FOR UPDATE
          USING (auth.uid() IS NOT NULL)
          WITH CHECK (auth.uid() IS NOT NULL);
      ';
    END IF;
  END IF;
END $$;

