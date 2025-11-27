# 🚀 Quick Supabase Setup Guide - Get Your App Working NOW!

This is a **step-by-step guide** to connect your Wheely app to Supabase so you can save profiles and cars.

---

## ✅ Step 1: Verify Environment Variables (Already Done!)

Your `.env.local` file already has the correct credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://jzgshexcdhvhupqasmvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

✅ **This is already configured!** No action needed.

---

## ⚡ Step 2: Create Database Tables

This is the **most important step**. Without tables, nothing can save!

### 2.1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Log in with your account
3. Click on your project: **jzgshexcdhvhupqasmvz**

### 2.2: Open SQL Editor

1. Click **"SQL Editor"** in the left sidebar (looks like `</>`)
2. Click **"New query"** button (top left, or the `+` icon)
3. You'll see a blank text editor

### 2.3: Run the Schema SQL

**IMPORTANT:** Open the file `supabase-schema.sql` in your project folder.

1. Open `/Users/asulisufi/Downloads/Wheely/supabase-schema.sql`
2. **Select ALL the text** (Cmd+A or Ctrl+A)
3. **Copy it** (Cmd+C or Ctrl+C)
4. Go back to Supabase SQL Editor
5. **Paste it** in the editor (Cmd+V or Ctrl+V)
6. Click **"Run"** button (bottom right corner) OR press **Cmd+Enter** / **Ctrl+Enter**

### 2.4: Verify Success

You should see: ✅ **"Success. No rows returned"**

**If you see an error:**
- Make sure you copied the ENTIRE file (all 188 lines)
- Make sure you didn't copy any markdown (```) markers
- The file `supabase-schema.sql` has ONLY SQL code, no markdown

---

## 📦 Step 3: Create Storage Buckets

### 3.1: Go to Storage

1. In Supabase Dashboard, click **"Storage"** in left sidebar (📁 icon)
2. You'll see a list of buckets (might be empty)

### 3.2: Create First Bucket (car-images)

1. Click **"New bucket"** button (green button, top right)
2. Fill in:
   - **Name:** `car-images` (exactly this, no spaces)
   - **Public bucket:** ✅ **CHECK THIS BOX!** (very important!)
   - Leave other settings as default
3. Click **"Create bucket"**

### 3.3: Create Second Bucket (profile-logos)

1. Click **"New bucket"** again
2. Fill in:
   - **Name:** `profile-logos` (exactly this, no spaces)
   - **Public bucket:** ✅ **CHECK THIS BOX!**
3. Click **"Create bucket"**

### 3.4: Set Storage Policies

1. Go back to **SQL Editor**
2. Click **"New query"**
3. Open `/Users/asulisufi/Downloads/Wheely/supabase-storage.sql`
4. **Copy ALL the text** from that file
5. **Paste** it in SQL Editor
6. Click **"Run"**

You should see: ✅ **"Success. No rows returned"**

---

## 🧪 Step 4: Test Everything!

### 4.1: Restart Your Dev Server

```bash
# In your terminal, press Ctrl+C to stop the server
# Then start it again:
npm run dev
```

### 4.2: Test Profile

1. Go to: http://localhost:3000/profile
2. Click **"Edit Profile"**
3. Fill in:
   - Agency Name: "My Rental Company"
   - Email: your@email.com
   - Phone: "+1234567890"
   - Address: "123 Main St"
   - City: "New York"
4. Click **"Save Changes"**
5. Wait for success message
6. Page will refresh automatically
7. **Your data should be there!**

### 4.3: Verify in Supabase

1. Go to Supabase Dashboard
2. Click **"Table Editor"** in left sidebar
3. Click on **"profiles"** table
4. You should see **your saved data** in a row!

### 4.4: Test Cars

1. Go to: http://localhost:3000/cars
2. Click **"Add Car"**
3. Fill in:
   - Make: "Toyota"
   - Model: "Camry"
   - Year: 2023
   - License Plate: "ABC123"
   - Color: "Blue"
   - Transmission: Automatic
   - Fuel Type: Gasoline
   - Seats: 5
   - Daily Rate: 50
   - Status: Available
4. **Upload an image** (click or drag & drop)
5. Click **"Save Car"**
6. Car should appear in the list!

### 4.5: Verify Car in Supabase

1. Go to Supabase → **Table Editor**
2. Click on **"cars"** table
3. You should see **your car** in a row!

---

## 🎯 Quick Verification Checklist

After setup, verify these:

### In Supabase Dashboard:

**Database → Tables:**
- [ ] `profiles` table exists
- [ ] `cars` table exists
- [ ] `customers` table exists
- [ ] `bookings` table exists

**Storage → Buckets:**
- [ ] `car-images` bucket exists (Public ✅)
- [ ] `profile-logos` bucket exists (Public ✅)

**Table Editor:**
- [ ] `profiles` table has your profile data
- [ ] `cars` table has your test car

### In Your App:

- [ ] Can edit and save profile
- [ ] Profile data persists after refresh
- [ ] Can add a new car
- [ ] Can upload car image
- [ ] Car appears in the list
- [ ] Can edit existing car
- [ ] Can delete a car

---

## 🐛 Common Issues & Fixes

### Issue 1: "Failed to update profile" or "Failed to add car"

**Cause:** Tables don't exist or RLS policies are missing

**Fix:**
1. Go to Supabase → SQL Editor
2. Re-run the entire `supabase-schema.sql` file
3. Make sure you see "Success" message
4. Check: Database → Tables → should see all 4 tables

---

### Issue 2: Profile/Car data doesn't save

**Cause:** Row Level Security (RLS) policies not created

**Fix:**
1. Go to Supabase → Database → Tables
2. Click on `profiles` table
3. Click **"Policies"** tab at top
4. Should see policies like:
   - "Users can view their own profile"
   - "Users can update their own profile"
   - "Users can insert their own profile"
5. If missing, re-run `supabase-schema.sql`

---

### Issue 3: "Row Level Security policy violation"

**Cause:** You're not logged in or RLS policies are wrong

**Fix:**
1. Make sure you're logged in to the app
2. Check browser console (F12) for errors
3. Try logging out and back in
4. Re-run `supabase-schema.sql` to recreate policies

---

### Issue 4: Tables already exist error

**This is GOOD!** It means tables are already created.

**To start fresh (optional):**
```sql
-- Only run this if you want to delete everything and start over
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Then run supabase-schema.sql again
```

---

### Issue 5: Image upload works but doesn't save

**Cause:** Images are saved as base64 (works immediately)

**Status:** ✅ This is normal! Images save as base64 text in the database.

**Note:** If you want to use Supabase Storage instead (recommended for many images), let me know and I'll update it!

---

## 📊 How to Check Your Data

### Method 1: Table Editor (Easiest)

1. Supabase Dashboard → **Table Editor**
2. Click on a table name (e.g., `profiles`, `cars`)
3. See all your data in a spreadsheet view
4. Can edit, add, or delete rows manually

### Method 2: SQL Editor (Advanced)

```sql
-- See your profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- See your cars
SELECT * FROM cars WHERE owner_id = auth.uid();

-- Count your cars
SELECT COUNT(*) FROM cars WHERE owner_id = auth.uid();
```

---

## 🎉 Success! What You Can Do Now:

After completing this setup, you can:

✅ **Profile:**
- Edit your agency information
- Upload a logo
- Save changes that persist forever
- See your data in Supabase

✅ **Cars:**
- Add new cars with images
- Edit existing cars
- Delete cars
- All changes save to database
- Images upload and display

✅ **Future Features:**
- Customers will save to database
- Bookings will save to database
- Calendar will show real data
- Everything is connected!

---

## 🚀 Next Steps After Setup:

1. **Add your real data:**
   - Complete your profile with real info
   - Add your actual car fleet
   - Upload real car photos

2. **Test thoroughly:**
   - Add/edit/delete multiple times
   - Close browser and reopen
   - Data should always be there

3. **Deploy to production** when ready:
   - Create production Supabase project
   - Update environment variables
   - Deploy to Vercel/Netlify

---

## 📞 Need Help?

**If something doesn't work:**

1. Check browser console (F12) for errors
2. Check Supabase → Logs → API Logs
3. Verify you ran BOTH SQL files:
   - `supabase-schema.sql` ✅
   - `supabase-storage.sql` ✅
4. Make sure dev server is running: `npm run dev`
5. Try logging out and back in

---

## 🎯 TL;DR - Quick Setup (5 minutes)

1. ✅ Environment variables already configured
2. 🗄️ Supabase SQL Editor → Paste `supabase-schema.sql` → Run
3. 📦 Supabase Storage → Create 2 public buckets: `car-images`, `profile-logos`
4. 🔐 SQL Editor → Paste `supabase-storage.sql` → Run
5. 🧪 Test: Edit profile → Should save!
6. 🚗 Test: Add car → Should save!
7. 🎉 Done!

---

**Ready to start?** Follow the steps above and let me know if you hit any issues! I'm here to help! 🚀

