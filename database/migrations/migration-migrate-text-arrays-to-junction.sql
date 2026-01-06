-- Migration: Migrate TEXT[] arrays to car_locations junction table
-- This migration safely migrates existing pickup_locations and dropoff_locations
-- from TEXT[] columns to the car_locations junction table
--
-- Safety:
-- - Does not delete TEXT[] columns (kept for backward compatibility)
-- - Only inserts new junction rows (does not duplicate)
-- - Validates location IDs exist before inserting
-- - Idempotent (safe to run multiple times)

-- Step 1: Migrate pickup_locations from TEXT[] to car_locations
-- Only insert if location exists and junction doesn't already exist
INSERT INTO public.car_locations (car_id, location_id, location_type)
SELECT DISTINCT
  c.id AS car_id,
  unnest(c.pickup_locations)::uuid AS location_id,
  'pickup'::text AS location_type
FROM public.cars c
WHERE 
  c.pickup_locations IS NOT NULL
  AND array_length(c.pickup_locations, 1) > 0
  -- Ensure location exists
  AND EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id::text = ANY(c.pickup_locations)
  )
  -- Avoid duplicates (junction already exists)
  AND NOT EXISTS (
    SELECT 1 FROM public.car_locations cl
    WHERE cl.car_id = c.id
      AND cl.location_id::text = ANY(c.pickup_locations)
      AND cl.location_type = 'pickup'
  )
ON CONFLICT (car_id, location_id, location_type) DO NOTHING;

-- Step 2: Migrate dropoff_locations from TEXT[] to car_locations
INSERT INTO public.car_locations (car_id, location_id, location_type)
SELECT DISTINCT
  c.id AS car_id,
  unnest(c.dropoff_locations)::uuid AS location_id,
  'dropoff'::text AS location_type
FROM public.cars c
WHERE 
  c.dropoff_locations IS NOT NULL
  AND array_length(c.dropoff_locations, 1) > 0
  -- Ensure location exists
  AND EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id::text = ANY(c.dropoff_locations)
  )
  -- Avoid duplicates
  AND NOT EXISTS (
    SELECT 1 FROM public.car_locations cl
    WHERE cl.car_id = c.id
      AND cl.location_id::text = ANY(c.dropoff_locations)
      AND cl.location_type = 'dropoff'
  )
ON CONFLICT (car_id, location_id, location_type) DO NOTHING;

-- Step 3: Add validation function to ensure company ownership
-- This function validates that all locations belong to the same company as the car
CREATE OR REPLACE FUNCTION public.validate_car_location_company()
RETURNS TRIGGER AS $$
DECLARE
  car_company_id UUID;
  location_company_id UUID;
BEGIN
  -- Get car's company_id
  SELECT company_id INTO car_company_id
  FROM public.cars
  WHERE id = NEW.car_id;
  
  -- Get location's company_id
  SELECT company_id INTO location_company_id
  FROM public.locations
  WHERE id = NEW.location_id;
  
  -- Validate company match
  IF car_company_id IS NULL THEN
    RAISE EXCEPTION 'Car must have a company_id';
  END IF;
  
  IF location_company_id IS NULL THEN
    RAISE EXCEPTION 'Location must have a company_id';
  END IF;
  
  IF car_company_id != location_company_id THEN
    RAISE EXCEPTION 'Location company_id (%) does not match car company_id (%)', 
      location_company_id, car_company_id;
  END IF;
  
  -- Validate location type matches location flags
  IF NEW.location_type = 'pickup' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = NEW.location_id AND is_pickup = true
    ) THEN
      RAISE EXCEPTION 'Location % is not marked as pickup location', NEW.location_id;
    END IF;
  END IF;
  
  IF NEW.location_type = 'dropoff' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = NEW.location_id AND is_dropoff = true
    ) THEN
      RAISE EXCEPTION 'Location % is not marked as dropoff location', NEW.location_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add trigger to enforce company ownership and type validation
DROP TRIGGER IF EXISTS validate_car_location_company_trigger ON public.car_locations;
CREATE TRIGGER validate_car_location_company_trigger
  BEFORE INSERT OR UPDATE ON public.car_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_car_location_company();

-- Step 5: Verification query (uncomment to verify migration)
-- SELECT 
--   c.id AS car_id,
--   c.make || ' ' || c.model AS car_name,
--   COUNT(DISTINCT CASE WHEN cl.location_type = 'pickup' THEN cl.location_id END) AS pickup_count,
--   COUNT(DISTINCT CASE WHEN cl.location_type = 'dropoff' THEN cl.location_id END) AS dropoff_count,
--   array_length(c.pickup_locations, 1) AS old_pickup_count,
--   array_length(c.dropoff_locations, 1) AS old_dropoff_count
-- FROM public.cars c
-- LEFT JOIN public.car_locations cl ON cl.car_id = c.id
-- WHERE c.pickup_locations IS NOT NULL OR c.dropoff_locations IS NOT NULL
-- GROUP BY c.id, c.make, c.model, c.pickup_locations, c.dropoff_locations
-- ORDER BY c.id;

