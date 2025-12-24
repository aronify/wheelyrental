-- Fix companies UPDATE policy to allow all company members (not just owners/admins)
-- This allows any member of the company to update company info

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
      -- Policy allowing any company member to update (not just owners/admins)
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
      -- Fallback policy without company_members
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

