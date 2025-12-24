-- Debug script to check company access and RLS policies
-- Run this to see what's happening with your user's company access

-- 1. Check if user_has_company_access function exists
SELECT 
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'user_has_company_access';

-- 2. Check current user
SELECT auth.uid() as current_user_id;

-- 3. Check if company_members table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN 'company_members table EXISTS'
    ELSE 'company_members table DOES NOT EXIST'
  END as table_status;

-- 4. Check if user has company_members record (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    PERFORM (
      SELECT 
        cm.id,
        cm.company_id,
        cm.user_id,
        cm.role,
        cm.is_active,
        c.name as company_name
      FROM company_members cm
      JOIN companies c ON c.id = cm.company_id
      WHERE cm.user_id = auth.uid()
      LIMIT 1
    );
  ELSE
    RAISE NOTICE 'company_members table does not exist - skipping member check';
  END IF;
END $$;

-- 5. Check if user has any companies (direct check)
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone
FROM companies c
WHERE c.id IN (
  SELECT company_id 
  FROM company_members 
  WHERE user_id = auth.uid() 
    AND is_active = true
)
LIMIT 5;

-- 6. Test the helper function with a specific company_id
-- Replace 'YOUR_COMPANY_ID_HERE' with an actual company_id from step 5
-- SELECT public.user_has_company_access('YOUR_COMPANY_ID_HERE'::uuid);

-- 7. Check existing policies on companies table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;

-- 8. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

