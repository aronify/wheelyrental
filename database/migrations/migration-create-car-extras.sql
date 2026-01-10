-- ============================================================================
-- CAR EXTRAS FEATURE - DATABASE MIGRATION
-- ============================================================================
-- 
-- This migration adds support for car extras (GPS, child seats, insurance, etc.)
-- with customizable pricing per car.
--
-- Schema Design:
-- 1. extras table - Company-wide catalog of available extras
-- 2. car_extras table - Junction table linking cars to extras with prices
--
-- ============================================================================

-- ============================================================================
-- 1. CREATE EXTRAS TABLE
-- ============================================================================
-- Stores the master list of extras available for each company
-- Examples: GPS, Child Seat, Additional Driver, Full Insurance, etc.

CREATE TABLE IF NOT EXISTS public.extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC(10, 2) NOT NULL,
  unit TEXT DEFAULT 'per_day', -        
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT extras_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT extras_name_not_empty_chk 
    CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT extras_price_positive_chk 
    CHECK (default_price >= 0),
  CONSTRAINT extras_unit_valid_chk 
    CHECK (unit IN ('per_day', 'per_booking', 'one_time'))
) TABLESPACE pg_default;

-- Indexes for extras table
CREATE INDEX IF NOT EXISTS idx_extras_company_id 
  ON public.extras USING btree (company_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_extras_active 
  ON public.extras USING btree (is_active) 
  TABLESPACE pg_default
  WHERE is_active = true;

-- Unique constraint: Prevent duplicate extra names within same company
CREATE UNIQUE INDEX IF NOT EXISTS idx_extras_company_name_unique 
  ON public.extras USING btree (company_id, LOWER(name)) 
  TABLESPACE pg_default
  WHERE is_active = true;

-- ============================================================================
-- 2. CREATE CAR_EXTRAS JUNCTION TABLE
-- ============================================================================
-- Links cars to extras with car-specific pricing
-- Allows overriding the default price for specific cars

CREATE TABLE IF NOT EXISTS public.car_extras (
  car_id UUID NOT NULL,
  extra_id UUID NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  is_included BOOLEAN DEFAULT false, -- true if included in base daily rate
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Primary key
  CONSTRAINT car_extras_pkey 
    PRIMARY KEY (car_id, extra_id),
  
  -- Foreign keys
  CONSTRAINT car_extras_car_id_fkey 
    FOREIGN KEY (car_id) 
    REFERENCES public.cars(id) 
    ON DELETE CASCADE,
  CONSTRAINT car_extras_extra_id_fkey 
    FOREIGN KEY (extra_id) 
    REFERENCES public.extras(id) 
    ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT car_extras_price_positive_chk 
    CHECK (price >= 0)
) TABLESPACE pg_default;

-- Indexes for car_extras table
CREATE INDEX IF NOT EXISTS idx_car_extras_car_id 
  ON public.car_extras USING btree (car_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_car_extras_extra_id 
  ON public.car_extras USING btree (extra_id) 
  TABLESPACE pg_default;

-- ============================================================================
-- 3. CREATE UPDATED_AT TRIGGER FOR EXTRAS
-- ============================================================================
-- Automatically update the updated_at timestamp when extras are modified

CREATE TRIGGER extras_update_updated_at_trg 
  BEFORE UPDATE ON public.extras 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================
-- Grant permissions to authenticated and anon roles

-- Extras table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO anon;

-- Car extras table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO anon;

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_extras ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR EXTRAS TABLE
-- ============================================================================

-- SELECT: Users can view extras from their company
CREATE POLICY extras_select_company 
  ON public.extras 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.company_id = extras.company_id
    )
  );

-- INSERT: Users can create extras for their company
CREATE POLICY extras_insert_company 
  ON public.extras 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.company_id = extras.company_id
    )
  );

-- UPDATE: Users can update extras from their company
CREATE POLICY extras_update_company 
  ON public.extras 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.company_id = extras.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.company_id = extras.company_id
    )
  );

-- DELETE: Users can delete extras from their company
CREATE POLICY extras_delete_company 
  ON public.extras 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.company_id = extras.company_id
    )
  );

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR CAR_EXTRAS TABLE
-- ============================================================================

-- SELECT: Users can view car extras for cars in their company
CREATE POLICY car_extras_select_company 
  ON public.car_extras 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.user_profiles ON user_profiles.company_id = cars.company_id
      WHERE cars.id = car_extras.car_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- INSERT: Users can add car extras for cars in their company
CREATE POLICY car_extras_insert_company 
  ON public.car_extras 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.user_profiles ON user_profiles.company_id = cars.company_id
      WHERE cars.id = car_extras.car_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update car extras for cars in their company
CREATE POLICY car_extras_update_company 
  ON public.car_extras 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.user_profiles ON user_profiles.company_id = cars.company_id
      WHERE cars.id = car_extras.car_id
      AND user_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.user_profiles ON user_profiles.company_id = cars.company_id
      WHERE cars.id = car_extras.car_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete car extras for cars in their company
CREATE POLICY car_extras_delete_company 
  ON public.car_extras 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      JOIN public.user_profiles ON user_profiles.company_id = cars.company_id
      WHERE cars.id = car_extras.car_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. INSERT COMMON EXTRAS (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- ============================================================================
-- This section inserts common car rental extras for testing purposes
-- You can customize this list or remove it entirely

/*
-- Note: Replace 'YOUR_COMPANY_ID_HERE' with your actual company UUID
-- Or comment out this section and add extras through the UI

INSERT INTO public.extras (company_id, name, description, default_price, unit) VALUES
  ('YOUR_COMPANY_ID_HERE', 'GPS Navigation', 'Portable GPS device with European maps', 8.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Child Seat', 'Safety child seat for ages 1-4', 5.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Booster Seat', 'Booster seat for ages 4-12', 4.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Additional Driver', 'Add a second authorized driver', 10.00, 'per_booking'),
  ('YOUR_COMPANY_ID_HERE', 'Full Insurance', 'Comprehensive insurance with zero deductible', 15.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Winter Tires', 'Snow tires for winter driving', 6.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Ski Rack', 'Roof-mounted ski equipment rack', 7.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Bike Rack', 'Roof-mounted bicycle rack', 7.00, 'per_day'),
  ('YOUR_COMPANY_ID_HERE', 'Phone Holder', 'Dashboard phone mount', 3.00, 'per_booking'),
  ('YOUR_COMPANY_ID_HERE', 'USB Charger', 'Multi-port USB car charger', 2.00, 'per_booking')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================
-- Uncomment these queries to verify the migration was successful

/*
-- Check tables were created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('extras', 'car_extras');

-- Check indexes were created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('extras', 'car_extras');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('extras', 'car_extras');

-- Check policies were created
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('extras', 'car_extras');

-- Check permissions were granted
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('extras', 'car_extras')
AND grantee IN ('authenticated', 'anon');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The extras feature is now ready to use!
-- 
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify with the queries above
-- 3. Use the UI to add extras to your company
-- 4. Assign extras to cars when adding/editing vehicles
-- ============================================================================
