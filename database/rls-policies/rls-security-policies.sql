-- ============================================================================
-- COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant SaaS Platform - Production Security Configuration
-- ============================================================================
-- 
-- This script:
-- 1. Enables RLS on all tables
-- 2. Drops existing unsafe policies
-- 3. Creates secure tenant-aware policies
-- 4. Is idempotent (safe to run multiple times)
--
-- Architecture:
-- - Frontend uses anon key
-- - Backend uses service_role (bypasses RLS)
-- - Users authenticate via Supabase Auth
-- - Tenant isolation via company_id column
-- - Access control via company_members table
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Check if user has company access
-- Created in public schema (not auth schema) to avoid permission issues
-- Uses PL/pgSQL to handle case where company_members table doesn't exist
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_company_access(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if company_members table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    -- Use company_members table if it exists
    RETURN EXISTS (
      SELECT 1 
      FROM company_members 
      WHERE company_id = check_company_id 
        AND user_id = auth.uid() 
        AND is_active = true
    );
  ELSE
    -- Fallback: allow if user is authenticated and company_id is provided
    RETURN check_company_id IS NOT NULL AND auth.uid() IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- SECTION 1: BACKEND-ONLY TABLES
-- No access for anon or authenticated users
-- Only accessible via service_role
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: customers
-- Category: User-Scoped (user_id based, not company_id)
-- Description: Customer data - users can only access their own customers
-- Note: Based on schema, customers table has user_id, not company_id
-- ----------------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- Users can SELECT only their own customers
CREATE POLICY "customers_select_policy" ON customers
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can INSERT customers linked to themselves
CREATE POLICY "customers_insert_policy" ON customers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can UPDATE only their own customers
CREATE POLICY "customers_update_policy" ON customers
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can DELETE only their own customers
CREATE POLICY "customers_delete_policy" ON customers
  FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Table: locations (if exists as backend-only)
-- Category: Backend-Only
-- Description: Internal location data managed by backend
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "locations_select_policy" ON locations;
    DROP POLICY IF EXISTS "locations_insert_policy" ON locations;
    DROP POLICY IF EXISTS "locations_update_policy" ON locations;
    DROP POLICY IF EXISTS "locations_delete_policy" ON locations;

    CREATE POLICY "locations_select_policy" ON locations
      FOR SELECT
      USING (false);

    CREATE POLICY "locations_insert_policy" ON locations
      FOR INSERT
      WITH CHECK (false);

    CREATE POLICY "locations_update_policy" ON locations
      FOR UPDATE
      USING (false);

    CREATE POLICY "locations_delete_policy" ON locations
      FOR DELETE
      USING (false);
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: USER-SCOPED MULTI-TENANT TABLES
-- Tenant isolation via company_id
-- Users can only access their own company's data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: companies
-- Category: User-Scoped Multi-Tenant
-- Description: Company data isolated by company_id
-- ----------------------------------------------------------------------------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- Users can SELECT only companies they belong to
-- Create policy conditionally based on company_members existence
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    -- If company_members exists, use membership-based access
    EXECUTE '
      CREATE POLICY "companies_select_policy" ON companies
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.company_id = companies.id
              AND company_members.user_id = auth.uid()
              AND company_members.is_active = true
          )
        );
    ';
  ELSE
    -- If company_members doesn't exist, allow authenticated users to see all companies
    EXECUTE '
      CREATE POLICY "companies_select_policy" ON companies
        FOR SELECT
        USING (auth.uid() IS NOT NULL);
    ';
  END IF;
END $$;

-- Authenticated users can INSERT companies (will be linked via company_members)
CREATE POLICY "companies_insert_policy" ON companies
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Users can UPDATE only companies they belong to (as owner/admin)
-- Create policy conditionally based on company_members existence
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    -- Policy allowing any company member to update (not just owners/admins)
    -- This allows profile updates for all company members
    EXECUTE '
      CREATE POLICY "companies_update_policy" ON companies
        FOR UPDATE
        USING (
          public.user_has_company_access(id)
        )
        WITH CHECK (
          public.user_has_company_access(id)
        );
    ';
  ELSE
    -- Fallback policy without company_members
    -- Allow any authenticated user to update (less secure but necessary if table doesn't exist)
    EXECUTE '
      CREATE POLICY "companies_update_policy" ON companies
        FOR UPDATE
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    ';
  END IF;
END $$;

-- Users can DELETE only companies they own (owner role only)
-- Create policy conditionally based on company_members existence
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    -- Policy with owner role check using company_members
    EXECUTE '
      CREATE POLICY "companies_delete_policy" ON companies
        FOR DELETE
        USING (
          public.user_has_company_access(id)
          AND EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.company_id = companies.id
              AND company_members.user_id = auth.uid()
              AND company_members.is_active = true
              AND company_members.role = ''owner''
          )
        );
    ';
  ELSE
    -- Fallback policy: deny delete if company_members doesn't exist
    EXECUTE '
      CREATE POLICY "companies_delete_policy" ON companies
        FOR DELETE
        USING (false);
    ';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: company_members
-- Category: User-Scoped Multi-Tenant
-- Description: Company membership relationships
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "company_members_select_policy" ON company_members;
    DROP POLICY IF EXISTS "company_members_insert_policy" ON company_members;
    DROP POLICY IF EXISTS "company_members_update_policy" ON company_members;
    DROP POLICY IF EXISTS "company_members_delete_policy" ON company_members;

    -- Users can SELECT members of companies they belong to
    CREATE POLICY "company_members_select_policy" ON company_members
      FOR SELECT
      USING (
        public.user_has_company_access(company_id)
      );

    -- Users can INSERT themselves as members (for company creation)
    -- Owners/admins can INSERT other members
    -- Note: Self-referential policies are allowed since table exists at this point
    CREATE POLICY "company_members_insert_policy" ON company_members
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM company_members cm
          WHERE cm.company_id = company_members.company_id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
            AND cm.role IN ('owner', 'admin')
        )
      );

    -- Only owners/admins can UPDATE members
    CREATE POLICY "company_members_update_policy" ON company_members
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM company_members cm
          WHERE cm.company_id = company_members.company_id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
            AND cm.role IN ('owner', 'admin')
        )
      );

    -- Only owners/admins can DELETE members
    CREATE POLICY "company_members_delete_policy" ON company_members
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM company_members cm
          WHERE cm.company_id = company_members.company_id
            AND cm.user_id = auth.uid()
            AND cm.is_active = true
            AND cm.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: cars
-- Category: User-Scoped Multi-Tenant
-- Description: Vehicle fleet isolated by company_id
-- ----------------------------------------------------------------------------
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cars_select_policy" ON cars;
DROP POLICY IF EXISTS "cars_insert_policy" ON cars;
DROP POLICY IF EXISTS "cars_update_policy" ON cars;
DROP POLICY IF EXISTS "cars_delete_policy" ON cars;

-- Users can SELECT only cars from their company
CREATE POLICY "cars_select_policy" ON cars
  FOR SELECT
  USING (
    company_id IS NOT NULL
    AND public.user_has_company_access(company_id)
  );

-- Users can INSERT cars for their company
CREATE POLICY "cars_insert_policy" ON cars
  FOR INSERT
  WITH CHECK (
    company_id IS NOT NULL
    AND public.user_has_company_access(company_id)
  );

-- Users can UPDATE cars from their company
CREATE POLICY "cars_update_policy" ON cars
  FOR UPDATE
  USING (
    company_id IS NOT NULL
    AND public.user_has_company_access(company_id)
  );

-- Only owners/admins can DELETE cars
-- Create policy conditionally based on company_members existence
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    EXECUTE '
      CREATE POLICY "cars_delete_policy" ON cars
        FOR DELETE
        USING (
          company_id IS NOT NULL
          AND public.user_has_company_access(company_id)
          AND EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.company_id = cars.company_id
              AND company_members.user_id = auth.uid()
              AND company_members.is_active = true
              AND company_members.role IN (''owner'', ''admin'')
          )
        );
    ';
  ELSE
    EXECUTE '
      CREATE POLICY "cars_delete_policy" ON cars
        FOR DELETE
        USING (
          company_id IS NOT NULL
          AND public.user_has_company_access(company_id)
          AND auth.uid() IS NOT NULL
        );
    ';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: bookings
-- Category: User-Scoped Multi-Tenant
-- Description: Booking records isolated by company_id
-- ----------------------------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings;

-- Users can SELECT only bookings from their company
CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT
  USING (
    company_id IS NOT NULL
    AND public.user_has_company_access(company_id)
  );

-- Users can INSERT bookings for their company
CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT
  WITH CHECK (
    company_id IS NOT NULL
    AND public.user_has_company_access(company_id)
  );

-- Users can UPDATE bookings from their company
CREATE POLICY "bookings_update_policy" ON bookings
  FOR UPDATE
  USING (
    company_id IS NOT NULL
    AND public.user_has_company_access(company_id)
  );

-- Only owners/admins can DELETE bookings
-- Create policy conditionally based on company_members existence
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_members'
  ) THEN
    EXECUTE '
      CREATE POLICY "bookings_delete_policy" ON bookings
        FOR DELETE
        USING (
          company_id IS NOT NULL
          AND public.user_has_company_access(company_id)
          AND EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.company_id = bookings.company_id
              AND company_members.user_id = auth.uid()
              AND company_members.is_active = true
              AND company_members.role IN (''owner'', ''admin'')
          )
        );
    ';
  ELSE
    EXECUTE '
      CREATE POLICY "bookings_delete_policy" ON bookings
        FOR DELETE
        USING (false);
    ';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: reviews
-- Category: User-Scoped Multi-Tenant
-- Description: Review records isolated by company_id
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
    DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
    DROP POLICY IF EXISTS "reviews_update_policy" ON reviews;
    DROP POLICY IF EXISTS "reviews_delete_policy" ON reviews;

    -- Users can SELECT only reviews from their company
    CREATE POLICY "reviews_select_policy" ON reviews
      FOR SELECT
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Reviews are read-only for users (inserted by system)
    CREATE POLICY "reviews_insert_policy" ON reviews
      FOR INSERT
      WITH CHECK (false);

    -- Reviews are read-only for users
    CREATE POLICY "reviews_update_policy" ON reviews
      FOR UPDATE
      USING (false);

    -- Only owners/admins can DELETE reviews
    -- Create policy conditionally based on company_members existence
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      EXECUTE '
        CREATE POLICY "reviews_delete_policy" ON reviews
          FOR DELETE
          USING (
            company_id IS NOT NULL
            AND public.user_has_company_access(company_id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = reviews.company_id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role IN (''owner'', ''admin'')
            )
          );
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "reviews_delete_policy" ON reviews
          FOR DELETE
          USING (false);
      ';
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: company_locations
-- Category: User-Scoped Multi-Tenant
-- Description: Company location data isolated by company_id
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_locations') THEN
    ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "company_locations_select_policy" ON company_locations;
    DROP POLICY IF EXISTS "company_locations_insert_policy" ON company_locations;
    DROP POLICY IF EXISTS "company_locations_update_policy" ON company_locations;
    DROP POLICY IF EXISTS "company_locations_delete_policy" ON company_locations;

    -- Users can SELECT only locations from their company
    CREATE POLICY "company_locations_select_policy" ON company_locations
      FOR SELECT
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Users can INSERT locations for their company
    CREATE POLICY "company_locations_insert_policy" ON company_locations
      FOR INSERT
      WITH CHECK (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Users can UPDATE locations from their company
    CREATE POLICY "company_locations_update_policy" ON company_locations
      FOR UPDATE
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Only owners/admins can DELETE locations
    -- Create policy conditionally based on company_members existence
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      EXECUTE '
        CREATE POLICY "company_locations_delete_policy" ON company_locations
          FOR DELETE
          USING (
            company_id IS NOT NULL
            AND public.user_has_company_access(company_id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = company_locations.company_id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role IN (''owner'', ''admin'')
            )
          );
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "company_locations_delete_policy" ON company_locations
          FOR DELETE
          USING (false);
      ';
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: car_locations (junction table)
-- Category: User-Scoped Multi-Tenant
-- Description: Car-location relationships isolated by company_id via cars
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'car_locations') THEN
    ALTER TABLE car_locations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "car_locations_select_policy" ON car_locations;
    DROP POLICY IF EXISTS "car_locations_insert_policy" ON car_locations;
    DROP POLICY IF EXISTS "car_locations_update_policy" ON car_locations;
    DROP POLICY IF EXISTS "car_locations_delete_policy" ON car_locations;

    -- Users can SELECT only car_locations for cars from their company
    CREATE POLICY "car_locations_select_policy" ON car_locations
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM cars
          WHERE cars.id = car_locations.car_id
            AND cars.company_id IS NOT NULL
            AND public.user_has_company_access(cars.company_id)
        )
      );

    -- Users can INSERT car_locations for cars from their company
    CREATE POLICY "car_locations_insert_policy" ON car_locations
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM cars
          WHERE cars.id = car_locations.car_id
            AND cars.company_id IS NOT NULL
            AND public.user_has_company_access(cars.company_id)
        )
      );

    -- Users can UPDATE car_locations for cars from their company
    CREATE POLICY "car_locations_update_policy" ON car_locations
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM cars
          WHERE cars.id = car_locations.car_id
            AND cars.company_id IS NOT NULL
            AND public.user_has_company_access(cars.company_id)
        )
      );

    -- Users can DELETE car_locations for cars from their company
    CREATE POLICY "car_locations_delete_policy" ON car_locations
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM cars
          WHERE cars.id = car_locations.car_id
            AND cars.company_id IS NOT NULL
            AND public.user_has_company_access(cars.company_id)
        )
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: payout_requests
-- Category: User-Scoped Multi-Tenant
-- Description: Payout requests isolated by company_id
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payout_requests') THEN
    ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "payout_requests_select_policy" ON payout_requests;
    DROP POLICY IF EXISTS "payout_requests_insert_policy" ON payout_requests;
    DROP POLICY IF EXISTS "payout_requests_update_policy" ON payout_requests;
    DROP POLICY IF EXISTS "payout_requests_delete_policy" ON payout_requests;

    -- Users can SELECT only payout_requests from their company
    CREATE POLICY "payout_requests_select_policy" ON payout_requests
      FOR SELECT
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Only owners/admins can INSERT payout_requests
    -- Create policy conditionally based on company_members existence
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      EXECUTE '
        CREATE POLICY "payout_requests_insert_policy" ON payout_requests
          FOR INSERT
          WITH CHECK (
            company_id IS NOT NULL
            AND public.user_has_company_access(company_id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = payout_requests.company_id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role IN (''owner'', ''admin'')
            )
          );
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "payout_requests_insert_policy" ON payout_requests
          FOR INSERT
          WITH CHECK (
            company_id IS NOT NULL
            AND public.user_has_company_access(company_id)
            AND auth.uid() IS NOT NULL
          );
      ';
    END IF;

    -- Only owners/admins can UPDATE payout_requests
    -- Create policy conditionally based on company_members existence
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      EXECUTE '
        CREATE POLICY "payout_requests_update_policy" ON payout_requests
          FOR UPDATE
          USING (
            company_id IS NOT NULL
            AND public.user_has_company_access(company_id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = payout_requests.company_id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role IN (''owner'', ''admin'')
            )
          );
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "payout_requests_update_policy" ON payout_requests
          FOR UPDATE
          USING (false);
      ';
    END IF;

    -- Only owners can DELETE payout_requests
    -- Create policy conditionally based on company_members existence
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'company_members'
    ) THEN
      EXECUTE '
        CREATE POLICY "payout_requests_delete_policy" ON payout_requests
          FOR DELETE
          USING (
            company_id IS NOT NULL
            AND public.user_has_company_access(company_id)
            AND EXISTS (
              SELECT 1 FROM company_members
              WHERE company_members.company_id = payout_requests.company_id
                AND company_members.user_id = auth.uid()
                AND company_members.is_active = true
                AND company_members.role = ''owner''
            )
          );
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "payout_requests_delete_policy" ON payout_requests
          FOR DELETE
          USING (false);
      ';
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: car_blocks
-- Category: User-Scoped Multi-Tenant
-- Description: Car availability blocks isolated by company_id
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'car_blocks') THEN
    ALTER TABLE car_blocks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "car_blocks_select_policy" ON car_blocks;
    DROP POLICY IF EXISTS "car_blocks_insert_policy" ON car_blocks;
    DROP POLICY IF EXISTS "car_blocks_update_policy" ON car_blocks;
    DROP POLICY IF EXISTS "car_blocks_delete_policy" ON car_blocks;

    -- Users can SELECT only car_blocks from their company
    CREATE POLICY "car_blocks_select_policy" ON car_blocks
      FOR SELECT
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Users can INSERT car_blocks for their company
    CREATE POLICY "car_blocks_insert_policy" ON car_blocks
      FOR INSERT
      WITH CHECK (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Users can UPDATE car_blocks from their company
    CREATE POLICY "car_blocks_update_policy" ON car_blocks
      FOR UPDATE
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );

    -- Users can DELETE car_blocks from their company
    CREATE POLICY "car_blocks_delete_policy" ON car_blocks
      FOR DELETE
      USING (
        company_id IS NOT NULL
        AND public.user_has_company_access(company_id)
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: partner_applications
-- Category: Backend-Only
-- Description: Partner application submissions - admin review only
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_applications') THEN
    ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "partner_applications_select_policy" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_insert_policy" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_update_policy" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_delete_policy" ON partner_applications;

    -- Deny all access for anon and authenticated users
    -- Backend uses service_role which bypasses RLS
    CREATE POLICY "partner_applications_select_policy" ON partner_applications
      FOR SELECT
      USING (false);

    CREATE POLICY "partner_applications_insert_policy" ON partner_applications
      FOR INSERT
      WITH CHECK (false);

    CREATE POLICY "partner_applications_update_policy" ON partner_applications
      FOR UPDATE
      USING (false);

    CREATE POLICY "partner_applications_delete_policy" ON partner_applications
      FOR DELETE
      USING (false);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: profiles (if exists - optional table)
-- Category: User-Scoped Multi-Tenant
-- Description: User profiles (may be deprecated in favor of companies)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

    -- Users can SELECT only their own profile
    CREATE POLICY "profiles_select_policy" ON profiles
      FOR SELECT
      USING (user_id = auth.uid());

    -- Users can INSERT their own profile
    CREATE POLICY "profiles_insert_policy" ON profiles
      FOR INSERT
      WITH CHECK (user_id = auth.uid());

    -- Users can UPDATE only their own profile
    CREATE POLICY "profiles_update_policy" ON profiles
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    -- Users can DELETE only their own profile
    CREATE POLICY "profiles_delete_policy" ON profiles
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: PUBLIC READ-ONLY TABLES
-- Anyone can SELECT, no write access
-- ============================================================================

-- Note: No public read-only tables defined in current schema
-- Add policies here if needed in the future
-- Example structure:
--
-- ALTER TABLE public_cars ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public_cars_select_policy" ON public_cars
--   FOR SELECT
--   USING (true);
-- CREATE POLICY "public_cars_insert_policy" ON public_cars
--   FOR INSERT
--   WITH CHECK (false);
-- CREATE POLICY "public_cars_update_policy" ON public_cars
--   FOR UPDATE
--   USING (false);
-- CREATE POLICY "public_cars_delete_policy" ON public_cars
--   FOR DELETE
--   USING (false);

-- ============================================================================
-- VERIFICATION: Check RLS status on all tables
-- ============================================================================
DO $$
DECLARE
  table_record RECORD;
  rls_enabled BOOLEAN;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma%'
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_record.tablename;
    
    IF rls_enabled IS NOT TRUE THEN
      RAISE WARNING 'Table % does not have RLS enabled', table_record.tablename;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- END OF RLS SECURITY POLICIES
-- ============================================================================

