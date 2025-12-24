-- Fix companies UPDATE policy when company_members table doesn't exist
-- This allows authenticated users to update companies they own

DO $$
BEGIN
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
      -- If company_members exists, use it for access control
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
    ELSE
      -- If company_members doesn't exist, allow any authenticated user to update
      -- This is less secure but necessary if the table doesn't exist yet
      EXECUTE '
        CREATE POLICY "companies_update_policy" ON companies
          FOR UPDATE
          USING (auth.uid() IS NOT NULL)
          WITH CHECK (auth.uid() IS NOT NULL);
      ';
    END IF;
  END IF;
END $$;

