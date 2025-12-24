-- Migration: Add Companies Table and Refactor Car Ownership
-- This migration introduces company-based ownership for cars
-- owner_id becomes a technical/administrative field, company_id represents business ownership

-- Step 1: Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  description TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  website TEXT,
  tax_id TEXT,
  logo TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Create company_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(company_id, user_id)
);

-- Step 3: Add company_id to cars table
ALTER TABLE cars 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cars_company_id ON cars(company_id);

-- Step 5: Add updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Step 7: Companies RLS Policies
-- Users can view companies (for public listings)
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  USING (true);

-- Only company members can update their company
CREATE POLICY "Company members can update their company"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.is_active = true
      AND company_members.role IN ('owner', 'admin')
    )
  );

-- Only authenticated users can create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 8: Company Members RLS Policies
-- Users can view company members of companies they belong to
CREATE POLICY "Users can view members of their companies"
  ON company_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Users can insert themselves as members (for company creation)
CREATE POLICY "Users can add themselves to companies"
  ON company_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Company owners/admins can manage members
CREATE POLICY "Company owners can manage members"
  ON company_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
      AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners can delete members"
  ON company_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Step 9: Update Cars RLS Policies to support company-based access
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own cars" ON cars;
DROP POLICY IF EXISTS "Users can insert their own cars" ON cars;
DROP POLICY IF EXISTS "Users can update their own cars" ON cars;
DROP POLICY IF EXISTS "Users can delete their own cars" ON cars;

-- New company-based policies
-- Users can view cars from companies they belong to OR cars they created (owner_id)
CREATE POLICY "Users can view company cars or their own cars"
  ON cars FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM company_members
        WHERE company_members.company_id = cars.company_id
        AND company_members.user_id = auth.uid()
        AND company_members.is_active = true
      )
    )
  );

-- Users can insert cars for their company OR as owner
CREATE POLICY "Users can insert cars for their company or as owner"
  ON cars FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM company_members
        WHERE company_members.company_id = company_id
        AND company_members.user_id = auth.uid()
        AND company_members.is_active = true
      )
    )
  );

-- Users can update cars from their company OR cars they own
CREATE POLICY "Users can update company cars or their own cars"
  ON cars FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM company_members
        WHERE company_members.company_id = cars.company_id
        AND company_members.user_id = auth.uid()
        AND company_members.is_active = true
      )
    )
  );

-- Users can delete cars from their company OR cars they own
CREATE POLICY "Users can delete company cars or their own cars"
  ON cars FOR DELETE
  USING (
    owner_id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM company_members
        WHERE company_members.company_id = cars.company_id
        AND company_members.user_id = auth.uid()
        AND company_members.is_active = true
        AND company_members.role IN ('owner', 'admin')
      )
    )
  );

-- Step 10: Migration helper - Create companies from existing profiles
-- This creates a company for each existing profile and links the user
DO $$
DECLARE
  profile_record RECORD;
  new_company_id UUID;
BEGIN
  FOR profile_record IN 
    SELECT p.*, u.id as user_id
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
  LOOP
    -- Create company from profile
    INSERT INTO companies (
      name,
      legal_name,
      description,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      website,
      tax_id,
      logo,
      verification_status
    )
    VALUES (
      profile_record.agency_name,
      profile_record.agency_name,
      NULL,
      profile_record.email,
      profile_record.phone,
      profile_record.address,
      profile_record.city,
      profile_record.country,
      profile_record.postal_code,
      profile_record.website,
      profile_record.tax_id,
      profile_record.logo,
      'pending' -- Start as pending, admin can verify later
    )
    RETURNING id INTO new_company_id;

    -- Link user as company owner
    INSERT INTO company_members (company_id, user_id, role, is_active)
    VALUES (new_company_id, profile_record.user_id, 'owner', true)
    ON CONFLICT (company_id, user_id) DO NOTHING;

    -- Update existing cars to link to company
    UPDATE cars
    SET company_id = new_company_id
    WHERE owner_id = profile_record.user_id
    AND company_id IS NULL;
  END LOOP;
END $$;




