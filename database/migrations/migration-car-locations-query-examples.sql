-- Query Examples for car_locations Junction Table
-- These examples demonstrate how to query cars by location for booking flows
--
-- Prerequisites:
-- - car_locations table must exist (run migration-create-car-locations-junction.sql)
-- - locations table must exist with proper structure
-- - cars table must exist with proper structure

-- ============================================================================
-- EXAMPLE 1: Find all cars available for pickup at a specific location
-- ============================================================================
-- Use case: User wants to see all cars they can pick up from location X
SELECT 
  c.id,
  c.make,
  c.model,
  c.year,
  c.license_plate,
  c.daily_rate,
  c.status,
  l.name AS pickup_location_name,
  l.city AS pickup_location_city
FROM cars c
INNER JOIN car_locations cl ON c.id = cl.car_id
INNER JOIN locations l ON cl.location_id = l.id
WHERE 
  cl.location_id = 'YOUR_LOCATION_ID_HERE'::uuid
  AND cl.location_type = 'pickup'
  AND c.status = 'active'
  AND l.is_active = true
ORDER BY c.daily_rate ASC;

-- ============================================================================
-- EXAMPLE 2: Find all cars available for dropoff at a specific location
-- ============================================================================
-- Use case: User wants to see all cars they can drop off at location Y
SELECT 
  c.id,
  c.make,
  c.model,
  c.year,
  c.license_plate,
  c.daily_rate,
  c.status,
  l.name AS dropoff_location_name,
  l.city AS dropoff_location_city
FROM cars c
INNER JOIN car_locations cl ON c.id = cl.car_id
INNER JOIN locations l ON cl.location_id = l.id
WHERE 
  cl.location_id = 'YOUR_LOCATION_ID_HERE'::uuid
  AND cl.location_type = 'dropoff'
  AND c.status = 'active'
  AND l.is_active = true
ORDER BY c.daily_rate ASC;

-- ============================================================================
-- EXAMPLE 3: Find cars available for both pickup AND dropoff at specific locations
-- ============================================================================
-- Use case: User wants to pick up from location X and drop off at location Y
SELECT DISTINCT
  c.id,
  c.make,
  c.model,
  c.year,
  c.license_plate,
  c.daily_rate,
  c.status,
  pickup_l.name AS pickup_location_name,
  dropoff_l.name AS dropoff_location_name
FROM cars c
INNER JOIN car_locations pickup_cl ON c.id = pickup_cl.car_id
INNER JOIN locations pickup_l ON pickup_cl.location_id = pickup_l.id
INNER JOIN car_locations dropoff_cl ON c.id = dropoff_cl.car_id
INNER JOIN locations dropoff_l ON dropoff_cl.location_id = dropoff_l.id
WHERE 
  pickup_cl.location_id = 'PICKUP_LOCATION_ID_HERE'::uuid
  AND pickup_cl.location_type = 'pickup'
  AND dropoff_cl.location_id = 'DROPOFF_LOCATION_ID_HERE'::uuid
  AND dropoff_cl.location_type = 'dropoff'
  AND c.status = 'active'
  AND pickup_l.is_active = true
  AND dropoff_l.is_active = true
ORDER BY c.daily_rate ASC;

-- ============================================================================
-- EXAMPLE 4: Get all locations (pickup and dropoff) for a specific car
-- ============================================================================
-- Use case: Display all locations where a car is available
SELECT 
  cl.location_type,
  l.id AS location_id,
  l.name AS location_name,
  l.city,
  l.address_line_1,
  l.is_pickup,
  l.is_dropoff
FROM car_locations cl
INNER JOIN locations l ON cl.location_id = l.id
WHERE 
  cl.car_id = 'YOUR_CAR_ID_HERE'::uuid
  AND l.is_active = true
ORDER BY cl.location_type, l.name;

-- ============================================================================
-- EXAMPLE 5: Count cars available at each location (for dashboard/analytics)
-- ============================================================================
SELECT 
  l.id AS location_id,
  l.name AS location_name,
  l.city,
  COUNT(DISTINCT CASE WHEN cl.location_type = 'pickup' THEN cl.car_id END) AS pickup_cars_count,
  COUNT(DISTINCT CASE WHEN cl.location_type = 'dropoff' THEN cl.car_id END) AS dropoff_cars_count,
  COUNT(DISTINCT cl.car_id) AS total_cars_count
FROM locations l
LEFT JOIN car_locations cl ON l.id = cl.location_id
LEFT JOIN cars c ON cl.car_id = c.id AND c.status = 'active'
WHERE 
  l.is_active = true
GROUP BY l.id, l.name, l.city
ORDER BY l.name;

-- ============================================================================
-- EXAMPLE 6: Find cars with at least one pickup location (for availability check)
-- ============================================================================
-- Use case: Ensure car has at least one pickup location before allowing booking
SELECT 
  c.id,
  c.make,
  c.model,
  c.license_plate,
  COUNT(DISTINCT cl.location_id) AS pickup_locations_count
FROM cars c
LEFT JOIN car_locations cl ON c.id = cl.car_id AND cl.location_type = 'pickup'
LEFT JOIN locations l ON cl.location_id = l.id AND l.is_active = true
WHERE 
  c.status = 'active'
GROUP BY c.id, c.make, c.model, c.license_plate
HAVING COUNT(DISTINCT CASE WHEN l.is_active = true THEN cl.location_id END) > 0
ORDER BY c.make, c.model;

-- ============================================================================
-- EXAMPLE 7: Supabase PostgREST query (for use in application code)
-- ============================================================================
-- This is how you would query using Supabase client in your application:
--
-- Find cars available for pickup at a location:
-- supabase
--   .from('cars')
--   .select(`
--     *,
--     car_locations!inner(
--       location_type,
--       location:locations!inner(
--         id,
--         name,
--         city,
--         address_line_1
--       )
--     )
--   `)
--   .eq('car_locations.location_id', locationId)
--   .eq('car_locations.location_type', 'pickup')
--   .eq('status', 'active')
--
-- Note: The 'inner' keyword ensures only cars with matching locations are returned

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- 1. The indexes created in the migration optimize these queries:
--    - idx_car_locations_car_id: Fast lookups of locations for a car
--    - idx_car_locations_location_id: Fast lookups of cars at a location
--    - idx_car_locations_location_type: Optimizes location_type filtering
--    - idx_car_locations_car_type: Optimizes car + location_type queries
--
-- 2. For best performance:
--    - Always filter by location_type when possible
--    - Use status = 'active' filter on cars table
--    - Use is_active = true filter on locations table
--    - Consider adding composite indexes if query patterns change

