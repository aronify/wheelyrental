-- Migration: Create car_locations junction table
-- This migration creates a proper junction table to link cars with locations
-- supporting multiple pickup and dropoff locations per car
--
-- Purpose:
-- - Enables many-to-many relationship between cars and locations
-- - Supports multiple pickup and dropoff locations per car
-- - Maintains referential integrity with foreign keys
-- - Enables efficient location-based car queries
--
-- Compatibility:
-- - Safe to run on existing databases (uses IF NOT EXISTS)
-- - Does not modify existing car records
-- - Works with existing locations table structure

-- Step 1: Create the car_locations junction table
CREATE TABLE IF NOT EXISTS public.car_locations (
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
CREATE INDEX IF NOT EXISTS idx_car_locations_car_id 
  ON public.car_locations 
  USING btree (car_id) 
  TABLESPACE pg_default;

-- Index on location_id for fast lookups of all cars at a location
CREATE INDEX IF NOT EXISTS idx_car_locations_location_id 
  ON public.car_locations 
  USING btree (location_id) 
  TABLESPACE pg_default;

-- Composite index for location-based car queries (pickup/dropoff filtering)
CREATE INDEX IF NOT EXISTS idx_car_locations_location_type 
  ON public.car_locations 
  USING btree (location_id, location_type) 
  TABLESPACE pg_default;

-- Composite index for car queries with location type filtering
CREATE INDEX IF NOT EXISTS idx_car_locations_car_type 
  ON public.car_locations 
  USING btree (car_id, location_type) 
  TABLESPACE pg_default;

-- Step 3: Add updated_at trigger
CREATE TRIGGER car_locations_update_updated_at_trg 
  BEFORE UPDATE ON public.car_locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Add table comment for documentation
COMMENT ON TABLE public.car_locations IS 
  'Junction table linking cars to locations. Supports multiple pickup and dropoff locations per car.';

COMMENT ON COLUMN public.car_locations.car_id IS 
  'Reference to the car that is available at this location';

COMMENT ON COLUMN public.car_locations.location_id IS 
  'Reference to the location where the car is available';

COMMENT ON COLUMN public.car_locations.location_type IS 
  'Type of location: pickup (car can be picked up here) or dropoff (car can be dropped off here)';

-- Step 5: Enable Row Level Security (RLS policies will be created separately)
ALTER TABLE public.car_locations ENABLE ROW LEVEL SECURITY;

-- Step 6: Verification queries (commented out - uncomment to verify)
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

