-- =====================================================
-- VERIFY: Check if user IDs match
-- =====================================================

-- Step 1: What is your current authenticated user ID?
-- (This is what you're logged in as)
SELECT auth.uid() as logged_in_user_id;

-- Step 2: What user_id do the customers have?
SELECT DISTINCT user_id, COUNT(*) as customer_count
FROM customers
GROUP BY user_id;

-- Step 3: Show all customers (regardless of user_id)
SELECT 
  id,
  user_id,
  name,
  email,
  city,
  created_at
FROM customers
ORDER BY created_at DESC;

-- Step 4: Check if they match
-- Replace YOUR_EXPECTED_USER_ID with the result from Step 1
SELECT 
  CASE 
    WHEN auth.uid() = '6a33bf27-3ae8-4584-9384-21843311beb7' 
    THEN '✅ MATCH - User IDs are the same!'
    ELSE '❌ MISMATCH - You are logged in with a different account!'
  END as result,
  auth.uid() as your_current_user_id,
  '6a33bf27-3ae8-4584-9384-21843311beb7' as expected_user_id;

