# Supabase Database Setup Guide

This guide will help you connect your Wheely car rental application to Supabase and set up all the necessary database tables.

## Prerequisites

✅ Supabase account created
✅ Project created in Supabase dashboard
✅ `.env.local` file configured with credentials

## Step 1: Database Schema

### 1.1 Create Tables

Go to your Supabase Dashboard → SQL Editor → New Query

Run this SQL to create all tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (user/agency information)
CREATE TABLE profiles (
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
  logo TEXT, -- URL to uploaded logo
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Cars table
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT NOT NULL,
  color TEXT,
  transmission TEXT NOT NULL CHECK (transmission IN ('automatic', 'manual')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  seats INTEGER NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'rented', 'maintenance', 'unavailable')),
  image_url TEXT,
  features TEXT[], -- Array of feature strings
  mileage INTEGER,
  vin TEXT,
  insurance_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Owner who manages this customer
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
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Owner
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

-- Create indexes for better query performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_cars_user_id ON cars(user_id);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_car_id ON bookings(car_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date_time, end_date_time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Set Up Row Level Security (RLS)

**IMPORTANT**: Enable RLS to secure your data!

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cars policies
CREATE POLICY "Users can view their own cars"
  ON cars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
  ON cars FOR DELETE
  USING (auth.uid() = user_id);

-- Customers policies
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

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (auth.uid() = user_id);
```

## Step 2: Storage Setup (For Images)

### 2.1 Create Storage Buckets

Go to: Storage → Create a new bucket

Create these buckets:

1. **`car-images`**
   - Public bucket
   - For car photos
   
2. **`logos`**
   - Public bucket
   - For agency logos

### 2.2 Set Storage Policies

For `car-images` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload car images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own car images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view images
CREATE POLICY "Anyone can view car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own car images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

For `logos` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view logos
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 3: Update Your Code

### 3.1 Profile Actions

Update `/app/profile/actions.ts`:

```typescript
'use server'

import { createServerComponentClient } from '@/lib/supabaseClient'
import { ProfileFormData } from '@/types/profile'

export async function updateProfileAction(profileData: ProfileFormData) {
  try {
    const supabase = await createServerComponentClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { error: 'Not authenticated' }
    }

    // Validate required fields
    if (!profileData.agencyName || !profileData.email || !profileData.phone) {
      return { error: 'Please fill in all required fields' }
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: session.user.id,
        agency_name: profileData.agencyName,
        description: profileData.description,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        country: profileData.country,
        postal_code: profileData.postalCode,
        website: profileData.website,
        tax_id: profileData.taxId,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Profile update error:', error)
      return { error: 'Failed to update profile. Please try again.' }
    }

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  } catch (error: any) {
    console.error('Profile update error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// Upload logo to Supabase Storage
export async function uploadLogoAction(file: File) {
  try {
    const supabase = await createServerComponentClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { error: 'Not authenticated' }
    }

    // Create unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Logo upload error:', error)
      return { error: 'Failed to upload logo' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    // Update profile with logo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ logo: publicUrl })
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { error: 'Failed to save logo URL' }
    }

    return {
      success: true,
      url: publicUrl,
    }
  } catch (error: any) {
    console.error('Logo upload error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
```

### 3.2 Load Profile Data

Update `/app/profile/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import ProfilePageRedesigned from './components/ProfilePageRedesigned'
import DashboardHeader from '../dashboard/components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'

export default async function ProfileRoute() {
  const supabase = await createServerComponentClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch profile from database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  // If no profile exists, create one with default values
  if (error || !profile) {
    const defaultProfile = {
      user_id: session.user.id,
      agency_name: 'My Rental Agency',
      description: '',
      email: session.user.email || '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postal_code: '',
      website: '',
      tax_id: '',
      logo: '',
    }

    await supabase.from('profiles').insert(defaultProfile)

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userEmail={session.user.email || ''} />
        <QuickAccessMenu />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ProfilePageRedesigned initialProfile={{
            ...defaultProfile,
            id: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userEmail={session.user.email || ''} />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <ProfilePageRedesigned initialProfile={{
          id: profile.id,
          userId: profile.user_id,
          agencyName: profile.agency_name,
          description: profile.description || '',
          email: profile.email,
          phone: profile.phone,
          address: profile.address || '',
          city: profile.city || '',
          country: profile.country || '',
          postalCode: profile.postal_code || '',
          website: profile.website || '',
          taxId: profile.tax_id || '',
          logo: profile.logo || '',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at),
        }} />
      </main>
    </div>
  )
}
```

### 3.3 Load Bookings

Update `/app/bookings/page.tsx`:

```typescript
// Replace dummyBookings with real query
const { data: bookingsData, error } = await supabase
  .from('bookings')
  .select(`
    *,
    car:cars(*),
    customer:customers(*)
  `)
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error fetching bookings:', error)
}

// Transform data to match Booking type
const bookings = bookingsData?.map(b => ({
  id: b.id,
  carId: b.car_id,
  carName: `${b.car.brand} ${b.car.model}`,
  carPlate: b.car.plate,
  carImageUrl: b.car.image_url || '/placeholder-car.jpg',
  customerId: b.customer_id,
  customerName: b.customer.name,
  customerPhone: b.customer.phone,
  startDateTime: b.start_date_time,
  endDateTime: b.end_date_time,
  pickupLocation: b.pickup_location,
  dropoffLocation: b.dropoff_location,
  totalPrice: parseFloat(b.total_price),
  status: b.status,
  createdAt: b.created_at,
})) || []
```

### 3.4 Load Cars

Update `/app/cars/page.tsx`:

```typescript
// Replace dummyCars with real query
const { data: carsData, error } = await supabase
  .from('cars')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error fetching cars:', error)
}

const cars = carsData?.map(c => ({
  id: c.id,
  brand: c.brand,
  model: c.model,
  year: c.year,
  plate: c.plate,
  color: c.color || '',
  transmission: c.transmission,
  fuelType: c.fuel_type,
  seats: c.seats,
  dailyRate: parseFloat(c.daily_rate),
  status: c.status,
  imageUrl: c.image_url || '/placeholder-car.jpg',
  features: c.features || [],
  mileage: c.mileage,
  vin: c.vin || '',
  insuranceExpiry: c.insurance_expiry,
})) || []
```

### 3.5 Load Customers

Update `/app/customers/page.tsx`:

```typescript
// Replace dummyCustomers with real query
const { data: customersData, error } = await supabase
  .from('customers')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error fetching customers:', error)
}

const customers = customersData?.map(c => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  address: c.address || '',
  city: c.city || '',
  country: c.country || '',
  postalCode: c.postal_code || '',
  driverLicense: c.driver_license || '',
  licenseExpiry: c.license_expiry,
  dateOfBirth: c.date_of_birth,
  notes: c.notes || '',
  totalBookings: 0, // Calculate separately if needed
  totalSpent: 0, // Calculate separately if needed
})) || []
```

## Step 4: Test the Connection

### 4.1 Verify Setup

1. **Check Tables**: Go to Database → Tables and verify all tables exist
2. **Check RLS**: Verify Row Level Security is enabled
3. **Check Storage**: Verify buckets are created

### 4.2 Test Queries

In SQL Editor, test:

```sql
-- Check if profile table is accessible
SELECT * FROM profiles LIMIT 1;

-- Check if cars table is accessible
SELECT * FROM cars LIMIT 1;

-- Check if bookings table is accessible
SELECT * FROM bookings LIMIT 1;
```

### 4.3 Test Application

1. Login to your application
2. Go to Profile page → Edit and save
3. Check Supabase Dashboard → Database → profiles table
4. Verify data was saved

## Step 5: Optional Enhancements

### 5.1 Add Functions for Complex Queries

```sql
-- Get booking statistics for a user
CREATE OR REPLACE FUNCTION get_booking_stats(owner_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_bookings', COUNT(*),
      'pending', COUNT(*) FILTER (WHERE status = 'pending'),
      'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
      'active', COUNT(*) FILTER (WHERE status = 'picked_up'),
      'total_revenue', COALESCE(SUM(total_price) FILTER (WHERE status IN ('picked_up', 'returned')), 0)
    )
    FROM bookings
    WHERE user_id = owner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 Add Real-time Subscriptions

In your components, add:

```typescript
const supabase = createClient()

// Subscribe to booking changes
useEffect(() => {
  const channel = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${session.user.id}`,
      },
      (payload) => {
        console.log('Booking changed:', payload)
        // Refresh bookings list
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Troubleshooting

### Common Issues

**1. RLS Blocking Queries**
- Make sure RLS policies are set correctly
- Check if `auth.uid()` matches `user_id`

**2. Storage Upload Fails**
- Verify bucket is public
- Check storage policies
- Verify file size limits

**3. Data Not Showing**
- Check browser console for errors
- Verify API keys in `.env.local`
- Check Supabase logs

**4. Authentication Issues**
- Clear browser cookies
- Check redirect URLs
- Verify auth settings

## Next Steps

1. ✅ Create database tables
2. ✅ Set up Row Level Security
3. ✅ Create storage buckets
4. ✅ Update code to use real data
5. ✅ Test everything
6. 🚀 Deploy to production

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check your project logs in Supabase Dashboard

---

**Your Wheely app is now connected to Supabase!** 🎉


