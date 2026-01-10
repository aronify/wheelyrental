-- ============================================================================
-- CHECK IF USER HAS COMPANY_ID
-- ============================================================================
-- Run this to see if you already have a company assigned
-- ============================================================================

-- 1. Check your current user ID
SELECT auth.uid() as your_user_id;

-- 2. Check if you have a company
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  auth.uid() as your_user_id,
  CASE 
    WHEN c.owner_id = auth.uid() THEN '✅ YOU HAVE A COMPANY'
    WHEN c.owner_id IS NULL THEN '⚠️ COMPANY EXISTS BUT NO OWNER'
    ELSE '❌ COMPANY OWNED BY SOMEONE ELSE'
  END as status
FROM public.companies c
WHERE c.owner_id = auth.uid();

-- 3. If no results above, you DON'T have a company (popup should show)
-- If you see a result, you HAVE a company (popup won't show)

-- 4. To TEST the popup, temporarily clear your company (CAREFUL!)
-- Uncomment this to remove your company ownership (for testing):
/*
UPDATE public.companies
SET owner_id = NULL
WHERE owner_id = auth.uid();
*/

-- 5. After testing, restore it with:
/*
UPDATE public.companies
SET owner_id = auth.uid()
WHERE name = 'YOUR_COMPANY_NAME'; -- Replace with your actual company name
*/
