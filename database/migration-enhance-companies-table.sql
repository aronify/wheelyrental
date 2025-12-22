-- Migration: Enhance Companies Table with All Profile Data
-- This migration adds all missing fields from profiles table to companies table
-- and migrates existing data from profiles to companies

-- Step 1: Add missing columns to companies table
-- Add description field
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add address fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add tax_id field
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add logo field
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS logo TEXT;

-- Replace is_verified boolean with verification_status text (if is_verified exists)
-- First check if is_verified exists, if so, convert it to verification_status
DO $$
BEGIN
  -- Check if is_verified column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'companies' 
      AND column_name = 'is_verified'
  ) THEN
    -- Add verification_status if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'verification_status'
    ) THEN
      ALTER TABLE public.companies 
        ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'));
      
      -- Migrate is_verified to verification_status
      UPDATE public.companies 
      SET verification_status = CASE 
        WHEN is_verified = true THEN 'verified'
        ELSE 'pending'
      END;
      
      -- Drop the old is_verified column
      ALTER TABLE public.companies DROP COLUMN is_verified;
      
      RAISE NOTICE 'Converted is_verified to verification_status';
    END IF;
  ELSE
    -- If is_verified doesn't exist, just ensure verification_status exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'verification_status'
    ) THEN
      ALTER TABLE public.companies 
        ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'));
      
      RAISE NOTICE 'Added verification_status column';
    END IF;
  END IF;
END $$;

-- Add verification_notes field
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add verified_at timestamp
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Note: Headquarters location is stored in company_locations table with is_hq = true
-- The company address fields (address, city, country, postal_code) represent the headquarters address

-- Add business registration fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_country TEXT,
  ADD COLUMN IF NOT EXISTS registration_date DATE;

-- Add contact person fields (primary contact)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_title TEXT;

-- Add social media and branding fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_color_primary TEXT,
  ADD COLUMN IF NOT EXISTS brand_color_secondary TEXT;

-- Add operational fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS operating_hours JSONB, -- Store hours as JSON: {"monday": {"open": "09:00", "close": "18:00"}, ...}
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add metadata fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS metadata JSONB, -- For storing additional flexible data
  ADD COLUMN IF NOT EXISTS notes TEXT; -- Internal notes about the company

-- Step 2: Create indexes for new columns (for better query performance)
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_country ON public.companies(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON public.companies(tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_registration_number ON public.companies(registration_number) WHERE registration_number IS NOT NULL;

-- Step 3: Migrate data from profiles to companies (if profiles table exists)
-- This assumes that each profile.user_id corresponds to a company_members.user_id
-- and we can link profiles to companies through company_members
DO $$
DECLARE
  profile_record RECORD;
  company_record RECORD;
  profiles_table_exists BOOLEAN;
BEGIN
  -- Check if profiles table exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles'
  ) INTO profiles_table_exists;
  
  -- Only proceed if profiles table exists
  IF profiles_table_exists THEN
    -- For each profile, find the associated company and update it
    FOR profile_record IN 
      SELECT 
        p.*,
        cm.company_id
      FROM profiles p
      INNER JOIN company_members cm ON p.user_id = cm.user_id
      WHERE cm.role = 'owner' -- Only update from owner's profile
        AND cm.is_active = true
    LOOP
    -- Update the company with profile data (only if company fields are NULL)
    UPDATE public.companies
    SET
      -- Only update if the field is currently NULL
      name = COALESCE(companies.name, profile_record.agency_name),
      legal_name = COALESCE(companies.legal_name, profile_record.agency_name),
      description = COALESCE(companies.description, profile_record.description),
      email = COALESCE(companies.email, profile_record.email),
      phone = COALESCE(companies.phone, profile_record.phone),
      address = COALESCE(companies.address, profile_record.address),
      city = COALESCE(companies.city, profile_record.city),
      country = COALESCE(companies.country, profile_record.country),
      postal_code = COALESCE(companies.postal_code, profile_record.postal_code),
      website = COALESCE(companies.website, profile_record.website),
      tax_id = COALESCE(companies.tax_id, profile_record.tax_id),
      logo = COALESCE(companies.logo, profile_record.logo),
      updated_at = NOW()
    WHERE id = profile_record.company_id
      AND (
        -- Only update if at least one field is NULL
        companies.description IS NULL
        OR companies.address IS NULL
        OR companies.city IS NULL
        OR companies.country IS NULL
        OR companies.postal_code IS NULL
        OR companies.tax_id IS NULL
        OR companies.logo IS NULL
      );
    END LOOP;
    
    RAISE NOTICE 'Migrated profile data to companies';
  ELSE
    RAISE NOTICE 'Profiles table does not exist, skipping profile data migration';
  END IF;
  
  -- Create/update headquarters location in company_locations for each company
  FOR company_record IN
    SELECT id, name, address, city, country, postal_code
    FROM public.companies
    WHERE address IS NOT NULL OR city IS NOT NULL
  LOOP
    -- Check if headquarters location already exists
    IF EXISTS (
      SELECT 1 FROM public.company_locations
      WHERE company_id = company_record.id
        AND is_hq = true
    ) THEN
      -- Update existing headquarters location
      UPDATE public.company_locations
      SET
        name = COALESCE(company_locations.name, company_record.name || ' Headquarters'),
        address_line_1 = COALESCE(company_locations.address_line_1, company_record.address),
        city = COALESCE(company_locations.city, company_record.city),
        country = COALESCE(company_locations.country, company_record.country, 'Albania'),
        postal_code = COALESCE(company_locations.postal_code, company_record.postal_code),
        is_pickup = true,
        is_dropoff = true,
        is_hq = true,
        is_active = true,
        updated_at = NOW()
      WHERE company_id = company_record.id
        AND is_hq = true;
    ELSE
      -- Create new headquarters location
      INSERT INTO public.company_locations (
        company_id,
        name,
        address_line_1,
        city,
        country,
        postal_code,
        is_pickup,
        is_dropoff,
        is_hq,
        is_active
      )
      VALUES (
        company_record.id,
        company_record.name || ' Headquarters',
        company_record.address,
        company_record.city,
        COALESCE(company_record.country, 'Albania'),
        company_record.postal_code,
        true,
        true,
        true,
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Created/updated headquarters locations in company_locations';
END $$;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.companies.description IS 'Company description/bio';
COMMENT ON COLUMN public.companies.address IS 'Company street address';
COMMENT ON COLUMN public.companies.city IS 'Company city';
COMMENT ON COLUMN public.companies.country IS 'Company country';
COMMENT ON COLUMN public.companies.postal_code IS 'Company postal/zip code';
COMMENT ON COLUMN public.companies.tax_id IS 'Company tax identification number';
COMMENT ON COLUMN public.companies.logo IS 'Company logo URL or storage path';
COMMENT ON COLUMN public.companies.verification_status IS 'Company verification status: pending, verified, rejected, suspended';
COMMENT ON COLUMN public.companies.verification_notes IS 'Admin notes about verification';
COMMENT ON COLUMN public.companies.verified_at IS 'Timestamp when company was verified';
COMMENT ON COLUMN public.companies.address IS 'Company headquarters address (also stored in company_locations with is_hq=true)';
COMMENT ON COLUMN public.companies.city IS 'Company headquarters city (also stored in company_locations with is_hq=true)';
COMMENT ON COLUMN public.companies.country IS 'Company headquarters country (also stored in company_locations with is_hq=true)';
COMMENT ON COLUMN public.companies.postal_code IS 'Company headquarters postal code (also stored in company_locations with is_hq=true)';
COMMENT ON COLUMN public.companies.registration_number IS 'Business registration number';
COMMENT ON COLUMN public.companies.registration_country IS 'Country where business is registered';
COMMENT ON COLUMN public.companies.registration_date IS 'Date of business registration';
COMMENT ON COLUMN public.companies.contact_person_name IS 'Primary contact person name';
COMMENT ON COLUMN public.companies.contact_person_email IS 'Primary contact person email';
COMMENT ON COLUMN public.companies.contact_person_phone IS 'Primary contact person phone';
COMMENT ON COLUMN public.companies.contact_person_title IS 'Primary contact person job title';
COMMENT ON COLUMN public.companies.operating_hours IS 'Company operating hours as JSON';
COMMENT ON COLUMN public.companies.timezone IS 'Company timezone (e.g., America/New_York)';
COMMENT ON COLUMN public.companies.currency IS 'Company default currency code (e.g., USD, EUR)';
COMMENT ON COLUMN public.companies.language IS 'Company default language code (e.g., en, al)';
COMMENT ON COLUMN public.companies.metadata IS 'Additional flexible metadata as JSON';
COMMENT ON COLUMN public.companies.notes IS 'Internal notes about the company';

-- Step 5: Create a function to automatically sync profile updates to company
-- This ensures that when a profile is updated, the company is also updated
-- Note: This function will only work if profiles table exists
CREATE OR REPLACE FUNCTION sync_profile_to_company()
RETURNS TRIGGER AS $$
DECLARE
  company_id_val UUID;
  company_locations_exists BOOLEAN;
BEGIN
  -- Check if company_locations table exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'company_locations'
  ) INTO company_locations_exists;
  
  -- Find the company_id for this user
  SELECT cm.company_id INTO company_id_val
  FROM company_members cm
  WHERE cm.user_id = NEW.user_id
    AND cm.role = 'owner'
    AND cm.is_active = true
  LIMIT 1;
  
  -- If company found, update it
  IF company_id_val IS NOT NULL THEN
    BEGIN
      UPDATE public.companies
      SET
        name = COALESCE(NEW.agency_name, companies.name),
        legal_name = COALESCE(NEW.agency_name, companies.legal_name),
        description = COALESCE(NEW.description, companies.description),
        email = COALESCE(NEW.email, companies.email),
        phone = COALESCE(NEW.phone, companies.phone),
        address = COALESCE(NEW.address, companies.address),
        city = COALESCE(NEW.city, companies.city),
        country = COALESCE(NEW.country, companies.country),
        postal_code = COALESCE(NEW.postal_code, companies.postal_code),
        website = COALESCE(NEW.website, companies.website),
        tax_id = COALESCE(NEW.tax_id, companies.tax_id),
        logo = COALESCE(NEW.logo, companies.logo),
        updated_at = NOW()
      WHERE id = company_id_val;
      
      -- Update or create headquarters location in company_locations (only if table exists)
      IF company_locations_exists THEN
        IF EXISTS (
          SELECT 1 FROM public.company_locations
          WHERE company_id = company_id_val
            AND is_hq = true
        ) THEN
          -- Update existing headquarters location
          UPDATE public.company_locations
          SET
            name = COALESCE(company_locations.name, NEW.agency_name || ' Headquarters'),
            address_line_1 = COALESCE(NEW.address, company_locations.address_line_1),
            city = COALESCE(NEW.city, company_locations.city),
            country = COALESCE(NEW.country, company_locations.country, 'Albania'),
            postal_code = COALESCE(NEW.postal_code, company_locations.postal_code),
            updated_at = NOW()
          WHERE company_id = company_id_val
            AND is_hq = true;
        ELSE
          -- Create new headquarters location if address is provided
          IF NEW.address IS NOT NULL OR NEW.city IS NOT NULL THEN
            INSERT INTO public.company_locations (
              company_id,
              name,
              address_line_1,
              city,
              country,
              postal_code,
              is_pickup,
              is_dropoff,
              is_hq,
              is_active
            )
            VALUES (
              company_id_val,
              COALESCE(NEW.agency_name, 'Headquarters') || ' Headquarters',
              NEW.address,
              NEW.city,
              COALESCE(NEW.country, 'Albania'),
              NEW.postal_code,
              true,
              true,
              true,
              true
            )
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the profile update
        -- The trigger should not prevent profile updates from succeeding
        RAISE WARNING 'Error syncing profile to company: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-sync profile updates to company (if profiles table exists)
DO $$
BEGIN
  -- Check if profiles table exists before creating trigger
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_sync_profile_to_company ON profiles;
    CREATE TRIGGER trigger_sync_profile_to_company
      AFTER INSERT OR UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION sync_profile_to_company();
    
    RAISE NOTICE 'Created trigger for profile to company sync';
  ELSE
    RAISE NOTICE 'Profiles table does not exist, skipping trigger creation';
  END IF;
END $$;

-- Step 7: Create function to sync company address changes to headquarters location
CREATE OR REPLACE FUNCTION sync_company_to_headquarters_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if address-related fields changed
  IF (OLD.address IS DISTINCT FROM NEW.address) OR
     (OLD.city IS DISTINCT FROM NEW.city) OR
     (OLD.country IS DISTINCT FROM NEW.country) OR
     (OLD.postal_code IS DISTINCT FROM NEW.postal_code) OR
     (OLD.name IS DISTINCT FROM NEW.name) THEN
    
    -- Check if headquarters location exists
    IF EXISTS (
      SELECT 1 FROM public.company_locations
      WHERE company_id = NEW.id
        AND is_hq = true
    ) THEN
      -- Update existing headquarters location
      UPDATE public.company_locations
      SET
        name = COALESCE(NEW.name || ' Headquarters', company_locations.name),
        address_line_1 = COALESCE(NEW.address, company_locations.address_line_1),
        city = COALESCE(NEW.city, company_locations.city),
        country = COALESCE(NEW.country, company_locations.country, 'Albania'),
        postal_code = COALESCE(NEW.postal_code, company_locations.postal_code),
        updated_at = NOW()
      WHERE company_id = NEW.id
        AND is_hq = true;
    ELSE
      -- Create new headquarters location if address is provided
      IF NEW.address IS NOT NULL OR NEW.city IS NOT NULL THEN
        INSERT INTO public.company_locations (
          company_id,
          name,
          address_line_1,
          city,
          country,
          postal_code,
          is_pickup,
          is_dropoff,
          is_hq,
          is_active
        )
        VALUES (
          NEW.id,
          COALESCE(NEW.name, 'Company') || ' Headquarters',
          NEW.address,
          NEW.city,
          COALESCE(NEW.country, 'Albania'),
          NEW.postal_code,
          true,
          true,
          true,
          true
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to auto-sync company address changes to headquarters location
DROP TRIGGER IF EXISTS trigger_sync_company_to_headquarters_location ON companies;
CREATE TRIGGER trigger_sync_company_to_headquarters_location
  AFTER INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_to_headquarters_location();

-- Step 9: Verification queries (uncomment to run after migration)
-- Check companies with all new fields
-- SELECT 
--   id,
--   name,
--   legal_name,
--   email,
--   phone,
--   address,
--   city,
--   country,
--   postal_code,
--   website,
--   tax_id,
--   logo,
--   verification_status,
--   address,
--   city,
--   country
-- FROM public.companies
-- LIMIT 5;

-- Check if all profiles have been synced
-- SELECT 
--   p.user_id,
--   p.agency_name,
--   cm.company_id,
--   c.name as company_name,
--   c.address as company_address
-- FROM profiles p
-- LEFT JOIN company_members cm ON p.user_id = cm.user_id AND cm.role = 'owner' AND cm.is_active = true
-- LEFT JOIN companies c ON cm.company_id = c.id
-- ORDER BY p.created_at DESC
-- LIMIT 10;

-- Migration completed: Companies table enhanced with all profile data
-- All columns have been added and data has been migrated from profiles table

