-- ============================================================================
-- CRITICAL SECURITY DIAGNOSTIC QUERIES
-- ============================================================================
-- Run these queries in Supabase SQL Editor to diagnose the RLS bypass issue
-- ============================================================================

-- ============================================================================
-- 1. CHECK COMPANIES TABLE STRUCTURE
-- ============================================================================
-- Shows all columns in companies table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CHECK OWNER_ID POPULATION
-- ============================================================================
-- Check how many companies have owner_id set vs NULL
SELECT 
  COUNT(*) as total_companies,
  COUNT(owner_id) as companies_with_owner_id,
  COUNT(*) - COUNT(owner_id) as companies_without_owner_id,
  ROUND(100.0 * COUNT(owner_id) / COUNT(*), 2) as percentage_with_owner_id
FROM public.companies;

-- Show companies without owner_id
SELECT 
  id as company_id,
  name,
  email,
  owner_id,
  created_at
FROM public.companies
WHERE owner_id IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- 3. CHECK USER-COMPANY RELATIONSHIPS
-- ============================================================================
-- Show all companies and their owners
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  c.email,
  c.created_at,
  COUNT(cars.id) as car_count
FROM public.companies c
LEFT JOIN public.cars ON cars.company_id = c.id
GROUP BY c.id, c.name, c.owner_id, c.email, c.created_at
ORDER BY c.created_at DESC;

-- ============================================================================
-- 4. CHECK CURRENT USER'S COMPANY ACCESS
-- ============================================================================
-- Shows what companies the current authenticated user should have access to
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  auth.uid() as your_user_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ YOU OWN THIS'
    WHEN c.owner_id IS NULL THEN '⚠️ NO OWNER SET'
    ELSE '❌ NOT YOUR COMPANY'
  END as access_status
FROM public.companies c
ORDER BY (c.owner_id = auth.uid()) DESC;

-- ============================================================================
-- 5. CHECK RLS POLICIES
-- ============================================================================
-- Verify RLS policies exist and are correct
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('companies', 'cars', 'locations', 'extras', 'car_extras')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- 6. CHECK RLS ENABLEMENT
-- ============================================================================
-- Verify RLS is actually enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('companies', 'cars', 'locations', 'extras', 'car_extras', 'bookings')
ORDER BY tablename;

-- ============================================================================
-- 7. TEST CURRENT USER'S ACCESS
-- ============================================================================
-- What data can you currently see?
SELECT 
  'companies' as table_name,
  COUNT(*) as visible_rows
FROM public.companies
UNION ALL
SELECT 
  'cars' as table_name,
  COUNT(*) as visible_rows
FROM public.cars
UNION ALL
SELECT 
  'locations' as table_name,
  COUNT(*) as visible_rows
FROM public.locations
UNION ALL
SELECT 
  'extras' as table_name,
  COUNT(*) as visible_rows
FROM public.extras;

-- ============================================================================
-- 8. IDENTIFY ORPHANED DATA
-- ============================================================================
-- Cars without valid company ownership
SELECT 
  cars.id as car_id,
  cars.make,
  cars.model,
  cars.company_id,
  companies.name as company_name,
  companies.owner_id,
  CASE 
    WHEN companies.id IS NULL THEN '❌ COMPANY MISSING'
    WHEN companies.owner_id IS NULL THEN '⚠️ NO OWNER'
    ELSE '✅ VALID'
  END as status
FROM public.cars
LEFT JOIN public.companies ON companies.id = cars.company_id
ORDER BY status, cars.created_at DESC;

-- ============================================================================
-- 9. CHECK FOR DUPLICATE OWNERS
-- ============================================================================
-- Check if one user owns multiple companies (should be 1:1)
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
-- INSTRUCTIONS
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Copy ALL the output results
-- 3. Share with me so I can analyze the exact state of your database
-- 4. I will then provide the exact fix SQL script
-- ============================================================================
