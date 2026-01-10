-- ============================================================================
-- FIX RLS POLICIES FOR CARS AND EXTRAS
-- ============================================================================
-- This script fixes Row Level Security (RLS) policies that are blocking
-- car saves and car extras operations.
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. GRANT PERMISSIONS TO ROLES
-- ============================================================================
-- Ensure authenticated and anon roles have permissions on all tables

-- Cars table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars TO anon;

-- Extras table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO anon;

-- Car extras table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO anon;

-- Companies table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO anon;

-- Locations table (if needed for car locations)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.locations TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- 2. ENABLE RLS ON ALL TABLES (if not already enabled)
-- ============================================================================
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================

-- Drop cars policies
DROP POLICY IF EXISTS "cars_select_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_insert_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_update_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_delete_policy" ON public.cars;

-- Drop extras policies
DROP POLICY IF EXISTS "extras_select_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_insert_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_update_policy" ON public.extras;
DROP POLICY IF EXISTS "extras_delete_policy" ON public.extras;

-- Drop car_extras policies
DROP POLICY IF EXISTS "car_extras_select_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_insert_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_update_policy" ON public.car_extras;
DROP POLICY IF EXISTS "car_extras_delete_policy" ON public.car_extras;

-- Drop companies policies
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- ============================================================================
-- 4. CREATE NEW RLS POLICIES FOR COMPANIES
-- ============================================================================

-- Allow users to select their own company
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT
  TO authenticated, anon
  USING (owner_id = auth.uid());

-- Allow users to insert a company (only if they don't have one)
CREATE POLICY "companies_insert_policy" ON public.companies
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (owner_id = auth.uid());

-- Allow users to update their own company
CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE
  TO authenticated, anon
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Allow users to delete their own company
CREATE POLICY "companies_delete_policy" ON public.companies
  FOR DELETE
  TO authenticated, anon
  USING (owner_id = auth.uid());

-- ============================================================================
-- 5. CREATE NEW RLS POLICIES FOR CARS
-- ============================================================================

-- Allow users to select cars from their company
CREATE POLICY "cars_select_policy" ON public.cars
  FOR SELECT
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Allow users to insert cars for their company
CREATE POLICY "cars_insert_policy" ON public.cars
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Allow users to update cars from their company
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

-- Allow users to delete cars from their company
CREATE POLICY "cars_delete_policy" ON public.cars
  FOR DELETE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. CREATE NEW RLS POLICIES FOR EXTRAS
-- ============================================================================

-- Allow users to select extras from their company
CREATE POLICY "extras_select_policy" ON public.extras
  FOR SELECT
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Allow users to insert extras for their company
CREATE POLICY "extras_insert_policy" ON public.extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- Allow users to update extras from their company
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

-- Allow users to delete extras from their company
CREATE POLICY "extras_delete_policy" ON public.extras
  FOR DELETE
  TO authenticated, anon
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. CREATE NEW RLS POLICIES FOR CAR_EXTRAS
-- ============================================================================

-- Allow users to select car_extras for their company's cars
CREATE POLICY "car_extras_select_policy" ON public.car_extras
  FOR SELECT
  TO authenticated, anon
  USING (
    car_id IN (
      SELECT id FROM public.cars 
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Allow users to insert car_extras for their company's cars
CREATE POLICY "car_extras_insert_policy" ON public.car_extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    car_id IN (
      SELECT id FROM public.cars 
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Allow users to update car_extras for their company's cars
CREATE POLICY "car_extras_update_policy" ON public.car_extras
  FOR UPDATE
  TO authenticated, anon
  USING (
    car_id IN (
      SELECT id FROM public.cars 
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    car_id IN (
      SELECT id FROM public.cars 
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Allow users to delete car_extras for their company's cars
CREATE POLICY "car_extras_delete_policy" ON public.car_extras
  FOR DELETE
  TO authenticated, anon
  USING (
    car_id IN (
      SELECT id FROM public.cars 
      WHERE company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 8. VERIFY PERMISSIONS
-- ============================================================================

-- Check that permissions are granted
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name IN ('cars', 'extras', 'car_extras', 'companies')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- 9. VERIFY RLS POLICIES
-- ============================================================================

-- Check that policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('cars', 'extras', 'car_extras', 'companies')
ORDER BY tablename, policyname;

-- ============================================================================
-- 10. TEST THE SETUP
-- ============================================================================

-- Check your company
SELECT id, name, owner_id FROM public.companies WHERE owner_id = auth.uid();

-- Check your extras
SELECT id, name, default_price FROM public.extras LIMIT 10;

-- Try to insert a test car (REPLACE 'YOUR_COMPANY_ID' with your actual company ID from above)
-- Uncomment and modify the following when ready to test:

/*
INSERT INTO public.cars (
  company_id,
  make,
  model,
  year,
  license_plate,
  transmission,
  fuel_type,
  seats,
  daily_rate,
  status
) VALUES (
  (SELECT id FROM public.companies WHERE owner_id = auth.uid() LIMIT 1),
  'Test Make',
  'Test Model',
  2024,
  'TEST' || floor(random() * 1000)::text, -- Random license plate to avoid duplicates
  'automatic',
  'petrol',
  5,
  50.00,
  'active'
)
RETURNING *;
*/

-- Check if the test car was created
-- SELECT * FROM public.cars ORDER BY created_at DESC LIMIT 5;

-- ============================================================================
-- 11. TROUBLESHOOTING QUERIES
-- ============================================================================

-- If you still have issues, run these to diagnose:

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('cars', 'extras', 'car_extras', 'companies');

-- Check what company_id your user has
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  auth.uid() as your_user_id,
  CASE WHEN c.owner_id = auth.uid() THEN '✅ MATCH' ELSE '❌ NO MATCH' END as status
FROM public.companies c;

-- ============================================================================
-- DONE! 
-- ============================================================================
-- After running this script:
-- 1. Check the verification queries output
-- 2. Try adding a car from your UI
-- 3. Check if it appears in the database
-- 4. If still issues, share the error message
-- ============================================================================
