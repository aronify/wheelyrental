-- ============================================================================
-- RESET ALL COMPANIES - FORCE PROFILE COMPLETION
-- ============================================================================
-- This script removes all company ownership, forcing users to complete
-- their profile in /profile tab to create/claim their company.
-- 
-- ⚠️ WARNING: This is a DESTRUCTIVE operation!
-- - All companies will have their owner_id cleared
-- - All users will need to fill out /profile to get a company
-- - Related data (cars, locations, extras) will remain but orphaned
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: BACKUP CURRENT STATE (for safety)
-- ============================================================================

-- Create a backup table with current company data
DROP TABLE IF EXISTS companies_backup_before_reset;
CREATE TABLE companies_backup_before_reset AS 
SELECT * FROM public.companies;

DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM companies_backup_before_reset;
  RAISE NOTICE '✅ Backed up % companies to companies_backup_before_reset', backup_count;
END $$;

-- ============================================================================
-- STEP 2: SHOW WHAT WILL BE AFFECTED
-- ============================================================================

DO $$
DECLARE
  company_count INTEGER;
  car_count INTEGER;
  location_count INTEGER;
  extra_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO company_count FROM public.companies WHERE owner_id IS NOT NULL;
  SELECT COUNT(*) INTO car_count FROM public.cars;
  SELECT COUNT(*) INTO location_count FROM public.locations;
  SELECT COUNT(*) INTO extra_count FROM public.extras;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '⚠️  IMPACT ANALYSIS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Companies with owners: %', company_count;
  RAISE NOTICE 'Cars in database: %', car_count;
  RAISE NOTICE 'Locations in database: %', location_count;
  RAISE NOTICE 'Extras in database: %', extra_count;
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT WILL HAPPEN:';
  RAISE NOTICE '1. All companies will have owner_id set to NULL';
  RAISE NOTICE '2. Cars, locations, extras will remain (linked to company_id)';
  RAISE NOTICE '3. Users must complete /profile to claim/create company';
  RAISE NOTICE '4. First user to complete profile for a company claims it';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 3: REMOVE ALL COMPANY OWNERSHIP (Clear owner_id)
-- ============================================================================

-- Option A: Clear owner_id (keeps companies, users must reclaim them)
UPDATE public.companies
SET owner_id = NULL
WHERE owner_id IS NOT NULL;

DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '✅ Cleared owner_id from % companies', affected_rows;
  RAISE NOTICE '→ Users must now complete /profile to claim ownership';
END $$;

-- ============================================================================
-- STEP 4: DROP UNIQUE CONSTRAINT (Allow multiple users to try claiming)
-- ============================================================================

-- Drop the unique constraint on owner_id so multiple users can try
-- The constraint will be re-added when a user claims the company
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS companies_owner_id_unique;

DO $$
BEGIN
  RAISE NOTICE '✅ Removed unique owner_id constraint';
  RAISE NOTICE '→ Multiple users can now claim companies';
END $$;

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  orphaned_companies INTEGER;
  total_companies INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_companies FROM public.companies WHERE owner_id IS NULL;
  SELECT COUNT(*) INTO total_companies FROM public.companies;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RESET COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total companies: %', total_companies;
  RAISE NOTICE 'Companies without owner: %', orphaned_companies;
  RAISE NOTICE 'Backup table: companies_backup_before_reset';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS FOR USERS:';
  RAISE NOTICE '1. Logout and login';
  RAISE NOTICE '2. Quick Start Guide will appear';
  RAISE NOTICE '3. Click "Complete Your Profile"';
  RAISE NOTICE '4. Fill in company details and save';
  RAISE NOTICE '5. Company will be assigned to that user';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT:';
  RAISE NOTICE '- First user to save profile for a company claims it';
  RAISE NOTICE '- If multiple users try, first one wins';
  RAISE NOTICE '- Other users will create NEW companies';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the script)
-- ============================================================================

-- Check all companies now have no owner
SELECT 
  id,
  name,
  email,
  owner_id,
  CASE 
    WHEN owner_id IS NULL THEN '✅ READY TO BE CLAIMED'
    ELSE '❌ STILL HAS OWNER'
  END as status
FROM public.companies
ORDER BY created_at DESC;

-- Check the backup
SELECT COUNT(*) as backed_up_companies FROM companies_backup_before_reset;

-- Check cars, locations, extras (should still exist)
SELECT 
  'Cars' as data_type,
  COUNT(*) as count
FROM public.cars
UNION ALL
SELECT 
  'Locations' as data_type,
  COUNT(*) as count
FROM public.locations
UNION ALL
SELECT 
  'Extras' as data_type,
  COUNT(*) as count
FROM public.extras;

-- ============================================================================
-- ROLLBACK SCRIPT (If you need to undo this)
-- ============================================================================
-- To restore from backup, run:
/*
BEGIN;

-- Restore owner_id from backup
UPDATE public.companies c
SET owner_id = b.owner_id
FROM companies_backup_before_reset b
WHERE c.id = b.id;

-- Re-add unique constraint
ALTER TABLE public.companies 
ADD CONSTRAINT companies_owner_id_unique UNIQUE (owner_id);

-- Verify
SELECT COUNT(*) FROM public.companies WHERE owner_id IS NOT NULL;

COMMIT;
*/
