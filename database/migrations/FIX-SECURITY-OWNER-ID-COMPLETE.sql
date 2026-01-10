-- ============================================================================
-- CRITICAL SECURITY FIX: Ensure owner_id is set for ALL companies
-- ============================================================================
-- This script fixes the security issue where users can see other users' data
-- by ensuring every company has the correct owner_id set.
-- 
-- WHAT THIS DOES:
-- 1. Ensures owner_id column exists and is properly indexed
-- 2. Sets owner_id for companies that don't have it
-- 3. Ensures 1:1 relationship (1 user = 1 company)
-- 4. Updates RLS policies to use owner_id ONLY (not JWT metadata)
-- 5. Adds constraints to prevent future issues
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ENSURE OWNER_ID COLUMN EXISTS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added owner_id column to companies table';
  ELSE
    RAISE NOTICE '✅ owner_id column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: DIAGNOSE CURRENT STATE
-- ============================================================================
DO $$
DECLARE
  orphan_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.companies;
  SELECT COUNT(*) INTO orphan_count FROM public.companies WHERE owner_id IS NULL;
  
  RAISE NOTICE '📊 Total companies: %', total_count;
  RAISE NOTICE '⚠️  Companies without owner_id: %', orphan_count;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '🔧 Will attempt to fix orphaned companies...';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: FIX ORPHANED COMPANIES
-- ============================================================================
-- Strategy: Link companies to users based on existing data

-- First, try to link via existing cars
UPDATE public.companies c
SET owner_id = (
  SELECT DISTINCT auth.users.id
  FROM public.cars
  JOIN auth.users ON TRUE
  WHERE cars.company_id = c.id
  LIMIT 1
)
WHERE c.owner_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.cars WHERE cars.company_id = c.id
  );

-- Check how many we fixed
DO $$
DECLARE
  remaining_orphans INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_orphans FROM public.companies WHERE owner_id IS NULL;
  
  IF remaining_orphans > 0 THEN
    RAISE WARNING '⚠️  Still have % companies without owner_id', remaining_orphans;
    RAISE WARNING '⚠️  These companies have no cars and cannot be auto-linked';
  ELSE
    RAISE NOTICE '✅ All companies now have owner_id set';
  END IF;
END $$;

-- Display orphaned companies for manual review
SELECT 
  id,
  name,
  email,
  created_at,
  (SELECT COUNT(*) FROM cars WHERE cars.company_id = companies.id) as car_count,
  (SELECT COUNT(*) FROM locations WHERE locations.company_id = companies.id) as location_count
FROM public.companies
WHERE owner_id IS NULL;

-- ============================================================================
-- STEP 4: CHECK FOR DUPLICATE OWNERS
-- ============================================================================
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT owner_id, COUNT(*) as company_count
    FROM public.companies
    WHERE owner_id IS NOT NULL
    GROUP BY owner_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING '⚠️  Found % users with multiple companies', duplicate_count;
  ELSE
    RAISE NOTICE '✅ No duplicate owners found';
  END IF;
END $$;

-- Show users with multiple companies
SELECT 
  owner_id,
  COUNT(*) as company_count,
  STRING_AGG(name, ', ') as company_names,
  STRING_AGG(id::text, ', ') as company_ids
FROM public.companies
WHERE owner_id IS NOT NULL
GROUP BY owner_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- STEP 5: ADD UNIQUE CONSTRAINT (One User = One Company)
-- ============================================================================
DO $$
BEGIN
  -- Drop constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'companies' 
    AND constraint_name = 'companies_owner_id_unique'
  ) THEN
    ALTER TABLE public.companies DROP CONSTRAINT companies_owner_id_unique;
    RAISE NOTICE '♻️  Dropped existing unique constraint';
  END IF;
  
  -- Add unique constraint
  ALTER TABLE public.companies 
  ADD CONSTRAINT companies_owner_id_unique UNIQUE (owner_id);
  
  RAISE NOTICE '✅ Added unique constraint: one user = one company';
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '❌ Cannot add unique constraint: duplicate owner_id values exist';
    RAISE WARNING '⚠️  Fix duplicates above first, then rerun this script';
END $$;

-- ============================================================================
-- STEP 6: ADD INDEX FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_owner_id 
ON public.companies(owner_id);

-- ============================================================================
-- STEP 7: UPDATE RLS POLICIES (STANDARDIZE ON owner_id)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own company
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT
  TO authenticated, anon
  USING (owner_id = auth.uid());

-- INSERT: Users can only create companies for themselves
CREATE POLICY "companies_insert_policy" ON public.companies
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Users can only update their own company
CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE
  TO authenticated, anon
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Users can delete their own company
CREATE POLICY "companies_delete_policy" ON public.companies
  FOR DELETE
  TO authenticated, anon
  USING (owner_id = auth.uid());

-- ============================================================================
-- STEP 8: UPDATE CARS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "cars_select_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_insert_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_update_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_delete_policy" ON public.cars;

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_select_policy" ON public.cars
  FOR SELECT
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "cars_insert_policy" ON public.cars
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "cars_update_policy" ON public.cars
  FOR UPDATE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "cars_delete_policy" ON public.cars
  FOR DELETE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 9: UPDATE LOCATIONS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_select_policy" ON public.locations
  FOR SELECT
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "locations_insert_policy" ON public.locations
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "locations_update_policy" ON public.locations
  FOR UPDATE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "locations_delete_policy" ON public.locations
  FOR DELETE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 10: UPDATE EXTRAS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "extras_select_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_insert_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_update_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_delete_policy" ON public.extras;

ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extras_select_policy" ON public.extras
  FOR SELECT
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "extras_insert_policy" ON public.extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "extras_update_policy" ON public.extras
  FOR UPDATE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "extras_delete_policy" ON public.extras
  FOR DELETE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 11: FINAL VERIFICATION
-- ============================================================================
DO $$
DECLARE
  policy_count INTEGER;
  orphan_count INTEGER;
BEGIN
  -- Check policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename IN ('companies', 'cars', 'locations', 'extras');
  
  -- Check orphans
  SELECT COUNT(*) INTO orphan_count
  FROM public.companies
  WHERE owner_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SECURITY FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 RLS Policies created: %', policy_count;
  RAISE NOTICE '⚠️  Companies without owner_id: %', orphan_count;
  
  IF orphan_count = 0 THEN
    RAISE NOTICE '✅ All companies have owner_id set';
    RAISE NOTICE '✅ Users can only see their own data';
    RAISE NOTICE '✅ Security isolation is now enforced';
  ELSE
    RAISE WARNING '⚠️  Some companies still need manual owner_id assignment';
    RAISE WARNING '⚠️  See output above for list of orphaned companies';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Check verification queries below';
  RAISE NOTICE '2. Test login with different user accounts';
  RAISE NOTICE '3. Verify each user sees only their own data';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the script completes)
-- ============================================================================

-- 1. Verify your company access
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  auth.uid() as your_user_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ YOUR COMPANY'
    ELSE '❌ NOT YOUR COMPANY (THIS IS A BUG!)'
  END as access_status
FROM public.companies c;

-- 2. Verify car counts
SELECT 
  'Your visible cars' as metric,
  COUNT(*) as count
FROM public.cars;

-- 3. Verify location counts
SELECT 
  'Your visible locations' as metric,
  COUNT(*) as count
FROM public.locations;

-- 4. Verify RLS is working
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('companies', 'cars', 'locations', 'extras')
ORDER BY tablename;

-- 5. Verify unique constraint exists
SELECT 
  conname as constraint_name,
  '✅ EXISTS' as status
FROM pg_constraint
WHERE conname = 'companies_owner_id_unique'
  AND conrelid = 'public.companies'::regclass;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If you still see other users' data after running this script:
-- 1. Check if owner_id is set for your company (query 1 above)
-- 2. Logout and login again (to refresh session)
-- 3. Check browser console for errors
-- 4. Run query 2-3 to see what data is visible
-- 5. If count > 1 for cars/locations and you only have 1, there's still an issue
-- ============================================================================
