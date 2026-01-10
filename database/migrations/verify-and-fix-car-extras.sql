-- ============================================================================
-- VERIFICATION & FIX SCRIPT FOR CAR EXTRAS
-- ============================================================================
-- This script verifies that the car_extras table exists and has proper permissions
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. VERIFY TABLES EXIST
-- ============================================================================
SELECT 
  'extras table exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'extras'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'car_extras table exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'car_extras'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. CHECK TABLE STRUCTURE
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'car_extras'
ORDER BY ordinal_position;

-- 3. CHECK FOREIGN KEYS
-- ============================================================================
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'car_extras';

-- 4. CHECK RLS STATUS
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('extras', 'car_extras');

-- 5. CHECK RLS POLICIES
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('extras', 'car_extras')
ORDER BY tablename, policyname;

-- 6. CHECK PERMISSIONS
-- ============================================================================
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name IN ('extras', 'car_extras')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- 7. CHECK IF ANY DATA EXISTS
-- ============================================================================
SELECT 
  (SELECT COUNT(*) FROM public.extras) as extras_count,
  (SELECT COUNT(*) FROM public.car_extras) as car_extras_count,
  (SELECT COUNT(*) FROM public.cars) as cars_count;

-- 8. VERIFY COMPANIES TABLE
-- ============================================================================
SELECT 
  id,
  name,
  owner_id,
  created_at
FROM public.companies
LIMIT 5;

-- 9. CHECK IF YOUR USER HAS A COMPANY
-- ============================================================================
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  (SELECT email FROM auth.users WHERE id = c.owner_id) as owner_email
FROM public.companies c
WHERE c.owner_id = auth.uid(); -- This will use the current authenticated user

-- ============================================================================
-- FIX SCRIPT (RUN ONLY IF ISSUES FOUND)
-- ============================================================================

-- If car_extras table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS public.car_extras (
  car_id UUID NOT NULL,
  extra_id UUID NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  is_included BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT car_extras_pkey PRIMARY KEY (car_id, extra_id),
  CONSTRAINT car_extras_car_id_fkey FOREIGN KEY (car_id) 
    REFERENCES public.cars(id) ON DELETE CASCADE,
  CONSTRAINT car_extras_extra_id_fkey FOREIGN KEY (extra_id) 
    REFERENCES public.extras(id) ON DELETE CASCADE,
  CONSTRAINT car_extras_price_positive_chk CHECK (price >= 0)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_car_extras_car_id 
  ON public.car_extras USING btree (car_id);
CREATE INDEX IF NOT EXISTS idx_car_extras_extra_id 
  ON public.car_extras USING btree (extra_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO anon;

-- Enable RLS
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for car_extras
DROP POLICY IF EXISTS "car_extras_select_policy" ON public.car_extras;
CREATE POLICY "car_extras_select_policy" ON public.car_extras
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IN (
          SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "car_extras_insert_policy" ON public.car_extras;
CREATE POLICY "car_extras_insert_policy" ON public.car_extras
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IN (
          SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "car_extras_update_policy" ON public.car_extras;
CREATE POLICY "car_extras_update_policy" ON public.car_extras
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IN (
          SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IN (
          SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "car_extras_delete_policy" ON public.car_extras;
CREATE POLICY "car_extras_delete_policy" ON public.car_extras
  FOR DELETE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_extras.car_id
        AND cars.company_id IN (
          SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
  );

-- ============================================================================
-- TEST THE SETUP
-- ============================================================================
-- Try to fetch car extras (should work even if empty)
SELECT * FROM public.car_extras LIMIT 10;

-- Check extras table
SELECT * FROM public.extras LIMIT 10;

-- Check your cars
SELECT id, make, model, company_id FROM public.cars LIMIT 10;
