-- ============================================================================
-- STEP B: ENFORCE ONE USER = ONE COMPANY (DATABASE LEVEL)
-- ============================================================================
-- Prevents a user from being associated with multiple companies
-- Enforced via unique constraint on companies.owner_id column
-- This script is IDEMPOTENT - can be run multiple times safely
-- ============================================================================

-- Step 1: Create owner_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.companies
    ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added owner_id column to companies table';
  ELSE
    RAISE NOTICE 'owner_id column already exists in companies table';
  END IF;
END $$;

-- Step 2: Create index for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_companies_owner_id 
ON public.companies(owner_id)
WHERE owner_id IS NOT NULL;

-- Create unique index to prevent duplicate companies per user
-- This ensures one user can only own one company
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_one_owner_per_user
ON public.companies(owner_id)
WHERE owner_id IS NOT NULL;

-- Trigger-based enforcement (additional safety)
-- This trigger prevents inserting/updating a second company for the same user
CREATE OR REPLACE FUNCTION public.prevent_multiple_companies_per_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_company_count INTEGER;
BEGIN
  -- Only check if owner_id is being set/changed
  IF NEW.owner_id IS NOT NULL THEN
    -- On UPDATE: if owner_id is not changing, skip check
    IF TG_OP = 'UPDATE' AND OLD.owner_id IS NOT DISTINCT FROM NEW.owner_id THEN
      RETURN NEW; -- owner_id unchanged, allow update
    END IF;
    
    -- Check if user already owns a company
    -- On INSERT: check all companies
    -- On UPDATE: exclude the current company being updated (only if owner_id is changing)
    SELECT COUNT(*)
    INTO existing_company_count
    FROM public.companies
    WHERE owner_id = NEW.owner_id
      AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- If user already owns a company, prevent this insert/update
    IF existing_company_count > 0 THEN
      RAISE EXCEPTION 'User already owns a company. One user can only own one company.'
        USING ERRCODE = '23505';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS companies_one_user_one_company_trg ON public.companies;

-- Create trigger
CREATE TRIGGER companies_one_user_one_company_trg
  BEFORE INSERT OR UPDATE OF owner_id ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_multiple_companies_per_user();

-- Verify constraints
SELECT 
  'One user = one company enforcement' as status,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'companies'
  AND indexname LIKE '%one_owner_per_user%';

