-- ============================================================================
-- FIX OWNERSHIP MISMATCH: Transfer Company to Current User
-- ============================================================================
-- This updates the owner_id to match your currently logged-in user
-- ============================================================================

-- STEP 1: Check your current user ID
SELECT 
  auth.uid() as your_current_user_id,
  (SELECT owner_id FROM public.companies WHERE name = 'WheelyAdmin') as company_owner_id,
  CASE 
    WHEN auth.uid() = (SELECT owner_id FROM public.companies WHERE name = 'WheelyAdmin') 
    THEN '✅ ALREADY MATCHES'
    ELSE '❌ MISMATCH - NEEDS UPDATE'
  END as status;

-- STEP 2: Update the company to be owned by your current user
-- IMPORTANT: Only run this if you're SURE this is your company
UPDATE public.companies
SET owner_id = auth.uid()
WHERE name = 'WheelyAdmin'
  AND owner_id != auth.uid();

-- STEP 3: Verify the update
SELECT 
  id as company_id,
  name,
  owner_id,
  auth.uid() as your_user_id,
  CASE 
    WHEN owner_id = auth.uid() THEN '✅ YOU NOW OWN THIS'
    ELSE '❌ STILL MISMATCH'
  END as ownership_status
FROM public.companies
WHERE name = 'WheelyAdmin';

-- ============================================================================
-- ALTERNATIVE: If you have multiple companies, fix them all
-- ============================================================================
-- Uncomment this to update ALL companies without owner_id to your current user:
/*
UPDATE public.companies
SET owner_id = auth.uid()
WHERE owner_id IS NULL;
*/

-- ============================================================================
-- AFTER RUNNING THIS:
-- 1. Refresh your browser
-- 2. You should now see your company data
-- 3. Cars, locations, extras should all be visible
-- ============================================================================
