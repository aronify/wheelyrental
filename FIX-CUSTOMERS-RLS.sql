-- =====================================================
-- FIX: Add RLS Policies for Customers Table
-- =====================================================
-- This will allow you to see your customers!

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'customers';

-- If rowsecurity = true, we need to add policies

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

-- Create new policies that use user_id (not owner_id!)
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
  ON customers FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers';

-- Test query - you should now see your customers!
SELECT 
  id,
  name,
  email,
  city
FROM customers 
WHERE user_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

