# Complete Supabase Setup Guide for Wheely

This guide will walk you through connecting your Wheely owner portal to Supabase step-by-step.

---

## 📋 Prerequisites

Before starting, make sure you have:
- A Supabase account (sign up at https://supabase.com)
- Your Wheely application running locally
- Access to your Supabase project dashboard

---

## Part 1: Initial Supabase Project Setup

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com and log in
2. Select your project (or create a new one)
3. Go to **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long JWT token)

### Step 2: Configure Environment Variables

Your `.env.local` file should already have these values. Verify it looks like this:

```
NEXT_PUBLIC_SUPABASE_URL=https://jzgshexcdhvhupqasmvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z3NoZXhjZGh2aHVwcWFzbXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTA5OTksImV4cCI6MjA3OTQ4Njk5OX0.IbxzbUvIudqCUCFrfzUB-3pMeSQbHNv7agDyYxG0R1U
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

✅ **This is already configured for your project!**

### Step 3: Configure Redirect URLs (Important for Auth)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```
3. Set **Site URL** to:
   ```
   http://localhost:3000
   ```
4. Click **Save**

---

## Part 2: Database Setup

### Step 4: Create Database Tables

1. In Supabase Dashboard, click on **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase-schema.sql` from your project
4. **Copy ALL the content** from `supabase-schema.sql`
5. **Paste it** into the SQL Editor
6. Click **Run** (or press Cmd+Enter / Ctrl+Enter)

✅ **Expected Result:** You should see "Success. No rows returned"

This creates these tables:
- `profiles` - Owner profile information
- `cars` - Car listings
- `customers` - Customer information
- `bookings` - Rental bookings
- Plus all necessary indexes and Row Level Security policies

### Step 5: Set Up Storage for Images

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **New Bucket**
3. Create a bucket named: `car-images`
   - Set it as **Public bucket** (check the box)
   - Click **Create Bucket**
4. Create another bucket named: `profile-logos`
   - Set it as **Public bucket** (check the box)
   - Click **Create Bucket**

### Step 6: Configure Storage Policies

1. Still in **Storage**, click on **Policies**
2. Go to **SQL Editor** again
3. Open the file `supabase-storage.sql` from your project
4. **Copy ALL the content** from `supabase-storage.sql`
5. **Paste it** into the SQL Editor
6. Click **Run**

✅ **Expected Result:** You should see "Success. No rows returned"

This allows authenticated users to upload/view images.

---

## Part 3: Create Your First User (Owner Account)

### Step 7: Sign Up in Your Application

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```
2. Open http://localhost:3000
3. Click **Sign Up** (or go to http://localhost:3000/signup)
4. Create your owner account with email and password
5. Check your email and click the confirmation link
6. Log in to your application

---

## Part 4: Update Application Code to Use Real Data

Now you need to update your application to fetch data from Supabase instead of using dummy data.

### Step 8: Update Profile Page

Open `/Users/asulisufi/Downloads/Wheely/app/profile/page.tsx`

**Find this line:**
```typescript
const profile = dummyProfile
```

**Replace with:**
```typescript
// Fetch real profile from Supabase
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single()

// If no profile exists, create a default one
if (error || !profile) {
  const defaultProfile = {
    user_id: session.user.id,
    agency_name: 'My Agency',
    email: session.user.email,
    phone: '',
    address: '',
    city: '',
    country: '',
    description: '',
    logo_url: null,
  }
  
  await supabase.from('profiles').insert(defaultProfile)
  
  const { data: newProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
    
  const profileData = newProfile || defaultProfile
}
```

### Step 9: Update Profile Actions

Open `/Users/asulisufi/Downloads/Wheely/app/profile/actions.ts`

The current implementation saves to dummy data. Update it to save to Supabase:

```typescript
'use server'

import { createServerActionClient } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const profileData = {
      agency_name: formData.get('agency_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      description: formData.get('description') as string,
      logo_url: formData.get('logo_url') as string || null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', session.user.id)

    if (error) throw error

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}
```

### Step 10: Update Cars Page

Open `/Users/asulisufi/Downloads/Wheely/app/cars/page.tsx`

**Find:**
```typescript
const cars = dummyCars
```

**Replace with:**
```typescript
// Fetch real cars from Supabase
const { data: cars } = await supabase
  .from('cars')
  .select('*')
  .eq('owner_id', session.user.id)
  .order('created_at', { ascending: false })
```

### Step 11: Update Customers Page

Open `/Users/asulisufi/Downloads/Wheely/app/customers/page.tsx`

**Find:**
```typescript
const customers = dummyCustomers
```

**Replace with:**
```typescript
// Fetch real customers from Supabase
const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .eq('owner_id', session.user.id)
  .order('created_at', { ascending: false })
```

### Step 12: Update Bookings Page

Open `/Users/asulisufi/Downloads/Wheely/app/bookings/page.tsx`

**Find:**
```typescript
const bookings = dummyBookings
```

**Replace with:**
```typescript
// Fetch real bookings with car and customer details
const { data: bookings } = await supabase
  .from('bookings')
  .select(`
    *,
    car:cars(*),
    customer:customers(*)
  `)
  .eq('owner_id', session.user.id)
  .order('created_at', { ascending: false })
```

---

## Part 5: Testing Your Connection

### Step 13: Test Each Feature

1. **Profile**: 
   - Go to Profile page
   - Edit your agency info
   - Upload a logo
   - Save and verify changes persist after refresh

2. **Cars**:
   - Go to Cars page
   - Add a new car
   - Edit it
   - Delete it
   - Verify all changes are saved

3. **Customers**:
   - Go to Customers page
   - Add test customers
   - Verify they appear in the list

4. **Bookings**:
   - Go to Bookings page
   - Create test bookings
   - Change status (pending → confirmed)
   - Verify everything works

5. **Calendar**:
   - Go to Calendar page
   - Verify bookings appear on correct dates

---

## 🔍 Troubleshooting

### Issue: "Failed to fetch data"

**Solution:**
1. Check your `.env.local` file has correct credentials
2. Restart your dev server: `npm run dev`
3. Verify Supabase project is active (not paused)

### Issue: "Row Level Security policy violation"

**Solution:**
1. Make sure you ran `supabase-schema.sql` completely
2. In Supabase Dashboard → **Database** → **Tables**, click on a table
3. Click **Policies** tab and verify policies exist
4. If missing, re-run the SQL from Step 4

### Issue: "Cannot upload images"

**Solution:**
1. Verify buckets exist: **Storage** → should see `car-images` and `profile-logos`
2. Verify buckets are public
3. Re-run `supabase-storage.sql` from Step 6

### Issue: "Authentication not working"

**Solution:**
1. Verify redirect URLs in **Authentication** → **URL Configuration**
2. Make sure `NEXT_PUBLIC_SITE_URL=http://localhost:3000` is in `.env.local`
3. Restart dev server

### Issue: Page shows "undefined" or blank data

**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Verify you're logged in
4. Check that tables have data: **Database** → **Table Editor**

---

## 🎉 Success Checklist

- [ ] Environment variables configured
- [ ] Redirect URLs set in Supabase
- [ ] Database tables created (run `supabase-schema.sql`)
- [ ] Storage buckets created (`car-images`, `profile-logos`)
- [ ] Storage policies configured (run `supabase-storage.sql`)
- [ ] Created owner account via sign up
- [ ] Updated profile page to use real data
- [ ] Updated cars page to use real data
- [ ] Updated customers page to use real data
- [ ] Updated bookings page to use real data
- [ ] Tested all features and data persists

---

## 📚 Next Steps

Once everything is working:

1. **Add sample data** through the UI to test thoroughly
2. **Test on mobile** to verify responsive design
3. **Deploy to production** (Vercel recommended)
4. **Update environment variables** in production with production Supabase credentials

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the browser console for errors (F12)
2. Check Supabase logs: **Logs** → **API Logs**
3. Verify your SQL ran successfully
4. Make sure you're logged in
5. Try logging out and back in

**Common mistake:** Copying markdown code block markers (```) when running SQL. Always copy ONLY the SQL code, not the markdown formatting!

---

**Last Updated:** Nov 25, 2025

