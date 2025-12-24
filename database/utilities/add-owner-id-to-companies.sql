-- ============================================================================
-- Add owner_id column to companies table to link users directly
-- This replaces the need for company_members table
-- ============================================================================

-- Add owner_id column if it doesn't exist
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
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_companies_owner_id 
    ON public.companies(owner_id);
    
    RAISE NOTICE 'Added owner_id column to companies table';
  ELSE
    RAISE NOTICE 'owner_id column already exists in companies table';
  END IF;
END $$;

-- Create unique constraint: one company per user (one user = one company)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'companies_one_owner_per_user'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_one_owner_per_user
    ON public.companies(owner_id)
    WHERE owner_id IS NOT NULL;
    
    RAISE NOTICE 'Created unique constraint: one company per user';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Verify the changes
SELECT 
  'Companies table structure' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name = 'owner_id';

