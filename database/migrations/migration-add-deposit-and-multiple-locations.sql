-- Migration: Add deposit field and support multiple pickup/dropoff locations
-- This migration updates the cars table to:
-- 1. Ensure deposit_required field exists (already exists in schema, but ensuring it's correct)
-- 2. Add pickup_locations and dropoff_locations as TEXT[] arrays to support multiple locations

-- Step 1: Verify deposit_required column exists (it should already exist based on your schema)
-- If it doesn't exist for some reason, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'cars' 
      AND column_name = 'deposit_required'
  ) THEN
    ALTER TABLE public.cars ADD COLUMN deposit_required NUMERIC NULL;
    RAISE NOTICE 'Added deposit_required column';
  ELSE
    RAISE NOTICE 'deposit_required column already exists';
  END IF;
END $$;

-- Step 2: Add new array columns for multiple locations
-- These columns will store arrays of location strings
ALTER TABLE public.cars 
  ADD COLUMN IF NOT EXISTS pickup_locations TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dropoff_locations TEXT[] DEFAULT NULL;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.cars.deposit_required IS 'Required deposit amount for this car (numeric value, nullable)';
COMMENT ON COLUMN public.cars.pickup_locations IS 'Array of available pickup locations for this car (TEXT[], nullable)';
COMMENT ON COLUMN public.cars.dropoff_locations IS 'Array of available dropoff locations for this car (TEXT[], nullable)';

-- Step 4: Create indexes for array columns (for better query performance)
-- GIN indexes are useful for array containment queries (e.g., WHERE 'location' = ANY(pickup_locations))
CREATE INDEX IF NOT EXISTS idx_cars_pickup_locations ON public.cars USING GIN (pickup_locations) WHERE pickup_locations IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_dropoff_locations ON public.cars USING GIN (dropoff_locations) WHERE dropoff_locations IS NOT NULL;

-- Verification query (run this to check the migration)
-- SELECT 
--   id, 
--   make, 
--   model, 
--   deposit_required, 
--   pickup_locations, 
--   dropoff_locations
-- FROM public.cars 
-- LIMIT 5;

