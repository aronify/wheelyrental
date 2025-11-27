-- =====================================================
-- FIXED READY-TO-USE SAMPLE DATA
-- =====================================================
-- Your User ID: 6a33bf27-3ae8-4584-9384-21843311beb7
-- Your Car ID: aba736fb-8364-4d51-9983-119c4e6ceccb
-- =====================================================
-- NOTE: This version uses the correct column names from your database
-- =====================================================

-- =====================================================
-- STEP 1: ADD CUSTOMERS (Run this first)
-- =====================================================

INSERT INTO customers (
  user_id,
  name,
  email,
  phone,
  address,
  city,
  country,
  postal_code,
  driver_license,
  license_expiry,
  notes
) VALUES 
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'John Smith',
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
    'Maria Garcia',
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
    'Ahmed Hassan',
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
    'Sophie Dubois',
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
    'Liam O''Brien',
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
-- STEP 2: GET CUSTOMER IDs (Run this after Step 1)
-- =====================================================
-- Copy this query and run it to see the customer IDs you just created

SELECT 
  id,
  name,
  email,
  city
FROM customers 
WHERE user_id = '6a33bf27-3ae8-4584-9384-21843311beb7'
ORDER BY created_at DESC;

-- =====================================================
-- STEP 3: ADD BOOKINGS (Run this after getting customer IDs)
-- =====================================================
-- IMPORTANT: Replace the 5 customer IDs below with the actual IDs from Step 2
-- 
-- Replace:
-- - CUSTOMER_ID_FOR_JOHN with John Smith's ID
-- - CUSTOMER_ID_FOR_MARIA with Maria Garcia's ID  
-- - CUSTOMER_ID_FOR_AHMED with Ahmed Hassan's ID
-- - CUSTOMER_ID_FOR_SOPHIE with Sophie Dubois's ID
-- - CUSTOMER_ID_FOR_LIAM with Liam O'Brien's ID

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
  -- Booking 1: Confirmed for next week (John)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_JOHN',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '14 days',
    'Airport Terminal 1',
    'Airport Terminal 1',
    700.00,
    'confirmed',
    'Early morning pickup requested'
  ),
  -- Booking 2: Pending for next month (Maria)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_MARIA',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '37 days',
    'Downtown Office',
    'Downtown Office',
    560.00,
    'pending',
    'Awaiting payment confirmation'
  ),
  -- Booking 3: Currently picked up (Ahmed)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_AHMED',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    'Hotel Grand Plaza',
    'Airport Terminal 2',
    450.00,
    'picked_up',
    'Extended insurance added'
  ),
  -- Booking 4: Completed last week (Sophie)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_SOPHIE',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '13 days',
    'Airport Terminal 1',
    'Airport Terminal 1',
    700.00,
    'returned',
    'Car returned in excellent condition'
  ),
  -- Booking 5: Old completed booking (Liam)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_LIAM',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '38 days',
    'City Center',
    'City Center',
    560.00,
    'returned',
    'Repeat customer'
  ),
  -- Booking 6: Cancelled booking (John)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_JOHN',
    CURRENT_DATE + INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '20 days',
    'Airport Terminal 2',
    'Airport Terminal 2',
    400.00,
    'cancelled',
    'Customer cancelled due to schedule change'
  ),
  -- Booking 7: Today's pickup (Maria)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_MARIA',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    'Downtown Office',
    'Airport Terminal 1',
    300.00,
    'confirmed',
    'Business trip rental'
  ),
  -- Booking 8: Last month booking (Ahmed)
  (
    '6a33bf27-3ae8-4584-9384-21843311beb7',
    'aba736fb-8364-4d51-9983-119c4e6ceccb',
    'CUSTOMER_ID_FOR_AHMED',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '54 days',
    'Hotel Sunset',
    'Hotel Sunset',
    480.00,
    'returned',
    'Tourist booking'
  );

-- =====================================================
-- STEP 4: VERIFY YOUR DATA
-- =====================================================

-- Check customers
SELECT 
  name,
  email,
  city,
  phone
FROM customers 
WHERE user_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Check bookings
SELECT 
  b.status,
  b.pickup_date,
  b.dropoff_date,
  b.total_price,
  c.name as customer_name,
  car.make || ' ' || car.model as car_name
FROM bookings b
JOIN customers c ON b.customer_id = c.id
JOIN cars car ON b.car_id = car.id
WHERE b.owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7'
ORDER BY b.pickup_date DESC;

