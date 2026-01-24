-- ============================================================================
-- RESTORE: car_locations Table
-- ============================================================================
-- 
-- This script restores the car_locations junction table that was accidentally deleted.
-- It recreates the table, indexes, triggers, and RLS policies.
--
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Create the car_locations junction table
CREATE TABLE public.car_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  location_id UUID NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('pickup', 'dropoff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT car_locations_pkey PRIMARY KEY (id),
  
  -- Foreign key to cars table
  CONSTRAINT car_locations_car_id_fkey 
    FOREIGN KEY (car_id) 
    REFERENCES public.cars(id) 
    ON DELETE CASCADE,
  
  -- Foreign key to locations table
  CONSTRAINT car_locations_location_id_fkey 
    FOREIGN KEY (location_id) 
    REFERENCES public.locations(id) 
    ON DELETE CASCADE,
  
  -- Unique constraint: prevent duplicate car-location-type combinations
  CONSTRAINT car_locations_unique_car_location_type 
    UNIQUE (car_id, location_id, location_type)
) TABLESPACE pg_default;

-- Step 2: Create indexes for performance
-- Index on car_id for fast lookups of all locations for a car
CREATE INDEX idx_car_locations_car_id 
  ON public.car_locations 
  USING btree (car_id) 
  TABLESPACE pg_default;

-- Index on location_id for fast lookups of all cars at a location
CREATE INDEX idx_car_locations_location_id 
  ON public.car_locations 
  USING btree (location_id) 
  TABLESPACE pg_default;

-- Composite index for location-based car queries (pickup/dropoff filtering)
CREATE INDEX idx_car_locations_location_type 
  ON public.car_locations 
  USING btree (location_id, location_type) 
  TABLESPACE pg_default;

-- Composite index for car queries with location type filtering
CREATE INDEX idx_car_locations_car_type 
  ON public.car_locations 
  USING btree (car_id, location_type) 
  TABLESPACE pg_default;

-- Step 3: Ensure update_updated_at_column() function exists
-- Create the function if it doesn't exist (used by the trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add updated_at trigger
CREATE TRIGGER car_locations_update_updated_at_trg 
  BEFORE UPDATE ON public.car_locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Add table comments for documentation
COMMENT ON TABLE public.car_locations IS 
  'Junction table linking cars to locations. Supports multiple pickup and dropoff locations per car.';

COMMENT ON COLUMN public.car_locations.car_id IS 
  'Reference to the car that is available at this location';

COMMENT ON COLUMN public.car_locations.location_id IS 
  'Reference to the location where the car is available';

COMMENT ON COLUMN public.car_locations.location_type IS 
  'Type of location: pickup (car can be picked up here) or dropoff (car can be dropped off here)';

-- Step 6: Enable Row Level Security
ALTER TABLE public.car_locations ENABLE ROW LEVEL SECURITY;

-- Step 6.1: Grant permissions to authenticated users
-- This ensures authenticated users can access the table (RLS policies will control what they can see)
GRANT ALL ON public.car_locations TO authenticated;

-- ============================================================================
-- Step 7: Create RLS Policies
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "car_locations_select_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_insert_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_update_policy" ON public.car_locations;
DROP POLICY IF EXISTS "car_locations_delete_policy" ON public.car_locations;

-- SELECT POLICY
-- Users can SELECT only car_locations for cars from their company
CREATE POLICY "car_locations_select_policy" ON public.car_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- INSERT POLICY
-- Users can INSERT car_locations for cars from their company
CREATE POLICY "car_locations_insert_policy" ON public.car_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- UPDATE POLICY
-- Users can UPDATE car_locations for cars from their company
CREATE POLICY "car_locations_update_policy" ON public.car_locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- DELETE POLICY
-- Users can DELETE car_locations for cars from their company
-- This is critical for the updateCarLocationsJunction function
CREATE POLICY "car_locations_delete_policy" ON public.car_locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      INNER JOIN public.companies ON companies.id = cars.company_id
      WHERE cars.id = car_locations.car_id
        AND cars.company_id IS NOT NULL
        AND companies.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Uncomment and run these to verify the table was created correctly:

-- Check table exists
-- SELECT table_name, table_schema 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'car_locations';

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'car_locations' AND schemaname = 'public';

-- Check constraints
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.car_locations'::regclass;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'car_locations';

-- Check policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'car_locations';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- What this table does:
-- - Links cars to locations in a many-to-many relationship
-- - Supports multiple pickup and dropoff locations per car
-- - Maintains referential integrity with foreign keys
-- - Enables efficient location-based car queries
--
-- Security:
-- - RLS is enabled and policies check company ownership
-- - Users can only access car_locations for cars from their company
--
-- Performance:
-- - Indexes on car_id, location_id, and composite indexes for common queries
-- - Foreign keys ensure data integrity
--
-- ============================================================================
