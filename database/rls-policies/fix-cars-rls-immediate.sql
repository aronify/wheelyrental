-- ============================================================================
-- IMMEDIATE FIX FOR CARS RLS
-- ============================================================================
-- This script fixes RLS for the cars table specifically
-- Uses defensive fallback so it works even if JWT is NULL
-- ============================================================================

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cars'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cars', policy_name);
  END LOOP;
END $$;

-- Create defensive SELECT policy (JWT with fallback)
CREATE POLICY cars_select_defensive ON public.cars
  FOR SELECT TO authenticated
  USING (
    -- Primary: JWT-based
    (company_id = ((auth.jwt() ->> 'company_id')::uuid))
    OR
    -- Fallback: Company lookup via owner_id (if JWT is NULL)
    (
      (auth.jwt() ->> 'company_id') IS NULL
      AND EXISTS (
        SELECT 1 
        FROM public.companies c 
        WHERE c.id = company_id 
        AND c.owner_id = auth.uid()
      )
    )
  );

-- Create defensive INSERT policy
CREATE POLICY cars_insert_defensive ON public.cars
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Primary: JWT-based
    (company_id = ((auth.jwt() ->> 'company_id')::uuid))
    OR
    -- Fallback: Company lookup via owner_id (if JWT is NULL)
    (
      (auth.jwt() ->> 'company_id') IS NULL
      AND EXISTS (
        SELECT 1 
        FROM public.companies c 
        WHERE c.id = company_id 
        AND c.owner_id = auth.uid()
      )
    )
  );

-- Create defensive UPDATE policy
CREATE POLICY cars_update_defensive ON public.cars
  FOR UPDATE TO authenticated
  USING (
    -- Primary: JWT-based
    (company_id = ((auth.jwt() ->> 'company_id')::uuid))
    OR
    -- Fallback: Company lookup via owner_id (if JWT is NULL)
    (
      (auth.jwt() ->> 'company_id') IS NULL
      AND EXISTS (
        SELECT 1 
        FROM public.companies c 
        WHERE c.id = company_id 
        AND c.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    -- Primary: JWT-based
    (company_id = ((auth.jwt() ->> 'company_id')::uuid))
    OR
    -- Fallback: Company lookup via owner_id (if JWT is NULL)
    (
      (auth.jwt() ->> 'company_id') IS NULL
      AND EXISTS (
        SELECT 1 
        FROM public.companies c 
        WHERE c.id = company_id 
        AND c.owner_id = auth.uid()
      )
    )
  );

-- Create defensive DELETE policy
CREATE POLICY cars_delete_defensive ON public.cars
  FOR DELETE TO authenticated
  USING (
    -- Primary: JWT-based
    (company_id = ((auth.jwt() ->> 'company_id')::uuid))
    OR
    -- Fallback: Company lookup via owner_id (if JWT is NULL)
    (
      (auth.jwt() ->> 'company_id') IS NULL
      AND EXISTS (
        SELECT 1 
        FROM public.companies c 
        WHERE c.id = company_id 
        AND c.owner_id = auth.uid()
      )
    )
  );

-- Fix grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars TO authenticated;
REVOKE ALL ON TABLE public.cars FROM anon;
REVOKE ALL ON TABLE public.cars FROM public;

-- Verify
SELECT 
  'Cars RLS Fixed' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'cars';

