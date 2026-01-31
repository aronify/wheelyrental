-- Wheely Database Schema
-- Copy and paste this entire file into Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS and DROP IF EXISTS where supported.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (user/agency information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agency_name TEXT NOT NULL,
  description TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  website TEXT,
  tax_id TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  color TEXT,
  transmission TEXT NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  seats INTEGER NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'rented', 'maintenance', 'unavailable')),
  image_url TEXT,
  features TEXT[],
  vin TEXT,
  insurance_expiry DATE,
  pickup_location TEXT,
  dropoff_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  driver_license TEXT,
  license_expiry DATE,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'picked_up', 'returned', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payout Requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_url TEXT NOT NULL,
  amount DECIMAL(10, 2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'confirmed')),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
-- Only create cars indexes if the columns exist (cars may have owner_id or company_id depending on migrations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cars' AND column_name = 'owner_id') THEN
    CREATE INDEX IF NOT EXISTS idx_cars_owner_id ON cars(owner_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date_time, end_date_time);
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at (drop first so re-run is safe)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cars_updated_at ON cars;
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payout_requests_updated_at ON payout_requests;
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies (drop first so re-run is safe)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cars policies (only if cars.owner_id exists; otherwise RLS may be handled by company-based migrations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cars' AND column_name = 'owner_id') THEN
    DROP POLICY IF EXISTS "Users can view their own cars" ON cars;
    CREATE POLICY "Users can view their own cars" ON cars FOR SELECT USING (auth.uid() = owner_id);
    DROP POLICY IF EXISTS "Users can insert their own cars" ON cars;
    CREATE POLICY "Users can insert their own cars" ON cars FOR INSERT WITH CHECK (auth.uid() = owner_id);
    DROP POLICY IF EXISTS "Users can update their own cars" ON cars;
    CREATE POLICY "Users can update their own cars" ON cars FOR UPDATE USING (auth.uid() = owner_id);
    DROP POLICY IF EXISTS "Users can delete their own cars" ON cars;
    CREATE POLICY "Users can delete their own cars" ON cars FOR DELETE USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Customers policies
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
CREATE POLICY "Users can update their own customers"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;
CREATE POLICY "Users can delete their own customers"
  ON customers FOR DELETE
  USING (auth.uid() = user_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
CREATE POLICY "Users can insert their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Payout Requests policies
DROP POLICY IF EXISTS "Users can view their own payout requests" ON payout_requests;
CREATE POLICY "Users can view their own payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payout requests" ON payout_requests;
CREATE POLICY "Users can insert their own payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);


