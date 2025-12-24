-- Fix profiles UPDATE policy - Add WITH CHECK clause
-- PostgreSQL RLS requires both USING and WITH CHECK for UPDATE policies

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

    CREATE POLICY "profiles_update_policy" ON profiles
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

