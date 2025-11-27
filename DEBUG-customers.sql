-- =====================================================
-- DEBUG: Check if customers exist in database
-- =====================================================

-- Step 1: Check if ANY customers exist at all
SELECT COUNT(*) as total_customers FROM customers;

-- Step 2: Check customers with YOUR user_id
SELECT 
  id,
  user_id,
  name,
  email,
  city,
  created_at
FROM customers 
WHERE user_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Step 3: Check ALL customers (to see if they have a different user_id)
SELECT 
  id,
  user_id,
  name,
  email,
  city,
  created_at
FROM customers 
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Check what columns the customers table actually has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

