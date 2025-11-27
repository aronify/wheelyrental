-- =====================================================
-- SAMPLE DATA FOR WHEELY CAR RENTAL PLATFORM
-- =====================================================
-- This script adds sample customers and bookings to your database
-- Your User ID: 6a33bf27-3ae8-4584-9384-21843311beb7
-- IMPORTANT: Replace 'YOUR_CAR_ID_HERE' with actual car IDs from your cars table

-- =====================================================
-- STEP 1: INSERT SAMPLE CUSTOMERS
-- =====================================================
-- User ID has been filled in automatically

INSERT INTO customers (
  owner_id,
  first_name,
  last_name,
  email,
  phone,
  address,
  city,
  country,
  postal_code,
  license_number,
  license_expiry_date,
  notes
) VALUES 
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'John',
    'Smith',
    'john.smith@example.com',
    '+1234567890',
    '123 Main Street',
    'New York',
    'USA',
    '10001',
    'DL123456',
    '2026-12-31',
    'Frequent customer, prefers automatic transmission'
  ),
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'Maria',
    'Garcia',
    'maria.garcia@example.com',
    '+1234567891',
    '456 Oak Avenue',
    'Los Angeles',
    'USA',
    '90001',
    'DL789012',
    '2027-06-30',
    'VIP customer, always books luxury cars'
  ),
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'Ahmed',
    'Hassan',
    'ahmed.hassan@example.com',
    '+1234567892',
    '789 Pine Road',
    'Chicago',
    'USA',
    '60601',
    'DL345678',
    '2025-09-15',
    'Business traveler, needs GPS'
  ),
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'Sophie',
    'Dubois',
    'sophie.dubois@example.com',
    '+1234567893',
    '321 Elm Street',
    'Miami',
    'USA',
    '33101',
    'DL901234',
    '2028-03-20',
    'Prefers SUVs for family trips'
  ),
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'Liam',
    'O''Brien',
    'liam.obrien@example.com',
    '+1234567894',
    '654 Maple Drive',
    'Boston',
    'USA',
    '02101',
    'DL567890',
    '2026-11-10',
    'Young driver, first time renter'
  );

-- =====================================================
-- STEP 2: INSERT SAMPLE BOOKINGS
-- =====================================================
-- IMPORTANT: You need to:
-- 1. ✅ User ID is already filled in
-- 2. Replace 'YOUR_CAR_ID_HERE' with actual car IDs from your cars table
-- 3. Replace 'CUSTOMER_ID_1', 'CUSTOMER_ID_2', etc. with actual customer IDs

-- Run this query to get your car IDs:
-- SELECT id, make, model FROM cars WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Run this query to get your customer IDs (after adding customers above):
-- SELECT id, first_name, last_name FROM customers WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Example bookings (UPDATE THE CAR AND CUSTOMER IDs BEFORE RUNNING):
INSERT INTO bookings (
  owner_id,
  car_id,
  customer_id,
  pickup_date,
  dropoff_date,
  pickup_location,
  dropoff_location,
  total_price,
  status,
  notes
) VALUES 
  -- Confirmed booking for next week
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_1',
    'CUSTOMER_ID_1',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '14 days',
    'Airport Terminal 1',
    'Airport Terminal 1',
    700.00,
    'confirmed',
    'Early morning pickup requested'
  ),
  -- Pending booking for next month
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_2',
    'CUSTOMER_ID_2',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '37 days',
    'Downtown Office',
    'Downtown Office',
    560.00,
    'pending',
    'Awaiting payment confirmation'
  ),
  -- Current booking (picked up)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_3',
    'CUSTOMER_ID_3',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    'Hotel Grand Plaza',
    'Airport Terminal 2',
    450.00,
    'picked_up',
    'Extended insurance added'
  ),
  -- Recent completed booking
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_1',
    'CUSTOMER_ID_4',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '13 days',
    'Airport Terminal 1',
    'Airport Terminal 1',
    700.00,
    'returned',
    'Car returned in excellent condition'
  ),
  -- Old confirmed booking
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_2',
    'CUSTOMER_ID_5',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '38 days',
    'City Center',
    'City Center',
    560.00,
    'returned',
    'Repeat customer'
  ),
  -- Cancelled booking
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_3',
    'CUSTOMER_ID_1',
    CURRENT_DATE + INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '20 days',
    'Airport Terminal 2',
    'Airport Terminal 2',
    400.00,
    'cancelled',
    'Customer cancelled due to schedule change'
  ),
  -- Today's pickup
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_1',
    'CUSTOMER_ID_2',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    'Downtown Office',
    'Airport Terminal 1',
    300.00,
    'confirmed',
    'Business trip rental'
  ),
  -- Last month booking (completed)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'YOUR_CAR_ID_2',
    'CUSTOMER_ID_3',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '54 days',
    'Hotel Sunset',
    'Hotel Sunset',
    480.00,
    'returned',
    'Tourist booking'
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After inserting data, run these queries to verify:

-- Check all customers
-- SELECT id, first_name, last_name, email, city FROM customers WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Check all bookings with customer and car details
-- SELECT 
--   b.id,
--   b.status,
--   b.pickup_date,
--   b.dropoff_date,
--   b.total_price,
--   c.first_name || ' ' || c.last_name as customer_name,
--   car.make || ' ' || car.model as car_name
-- FROM bookings b
-- JOIN customers c ON b.customer_id = c.id
-- JOIN cars car ON b.car_id = car.id
-- WHERE b.owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7'
-- ORDER BY b.pickup_date DESC;

