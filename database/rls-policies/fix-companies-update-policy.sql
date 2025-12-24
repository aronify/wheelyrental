-- Fix companies UPDATE policy - Add WITH CHECK clause
-- PostgreSQL RLS requires both USING and WITH CHECK for UPDATE policies

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
  ) THEN
    DROP POLICY IF EXISTS "companies_update_policy" ON companies;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      EXECUTE '
        CREATE POLICY "companies_update_policy" ON companies
          FOR UPDATE
          USING (
            public.user_has_company_access(id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = companies.id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role IN (''owner'', ''admin'')
            )
          )
          WITH CHECK (
            public.user_has_company_access(id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = companies.id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role IN (''owner'', ''admin'')
            )
          );
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "companies_update_policy" ON companies
          FOR UPDATE
          USING (
            public.user_has_company_access(id)
            AND auth.uid() IS NOT NULL
          )
          WITH CHECK (
            public.user_has_company_access(id)
            AND auth.uid() IS NOT NULL
          );
      ';
    END IF;
  END IF;
END $$;

