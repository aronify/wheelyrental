# Testing Guide - Wheely Owner Portal

## ✅ What Was Updated

I've successfully updated **ALL pages** to use real Supabase data instead of dummy data. Here's what changed:

### Updated Files:
1. ✅ **Profile Page** - Reads/writes to `profiles` table
2. ✅ **Cars Page** - Full CRUD operations with `cars` table
3. ✅ **Customers Page** - Reads from `customers` table
4. ✅ **Bookings Page** - Reads from `bookings` table with relations
5. ✅ **Calendar Page** - Displays real bookings from database
6. ✅ **Dashboard** - Shows real statistics from database

### New Files Created:
- `/app/cars/actions.ts` - Server actions for adding, updating, and deleting cars
- `/app/profile/actions.ts` - Updated to save profile data to Supabase

---

## 🧪 How to Test Everything

### Prerequisites:
1. ✅ Run `supabase-schema.sql` in Supabase SQL Editor (creates tables)
2. ✅ Create storage buckets: `car-images` and `profile-logos` (both PUBLIC)
3. ✅ Run `supabase-storage.sql` in Supabase SQL Editor (creates storage policies)
4. ✅ Make sure your `.env.local` has correct credentials
5. ✅ Restart your dev server: `npm run dev`

---

## 📝 Test 1: Profile Page

**URL:** http://localhost:3000/profile

### What to Test:
1. **First Visit:**
   - Page should load (might be empty or show default values)
   - If you see an error, it means tables aren't created yet

2. **Edit Profile:**
   - Click "Edit Profile" button
   - Fill in:
     - Agency Name: "My Rental Company"
     - Email: your email
     - Phone: "+1234567890"
     - Address: "123 Main St"
     - City: "New York"
     - Country: "USA"
   - Click "Save Changes"
   - You should see: "Profile updated successfully" (green toast)

3. **Verify It Saved:**
   - Refresh the page (F5)
   - Your agency name should still be there
   - Check Supabase: **Table Editor** → `profiles` → you should see your data

### ✅ Success Criteria:
- Profile saves and persists after refresh
- Data appears in Supabase `profiles` table

---

## 🚗 Test 2: Cars Page

**URL:** http://localhost:3000/cars

### What to Test:
1. **Add a Car:**
   - Click "Add Car" button
   - Fill in the form:
     - Make: "Toyota"
     - Model: "Camry"
     - Year: 2023
     - License Plate: "ABC-123"
     - Color: "Blue"
     - Transmission: "Automatic"
     - Fuel Type: "Gasoline"
     - Seats: 5
     - Daily Rate: 50
     - Status: "Available"
   - Click "Save Car"
   - You should see: "Car added successfully" (green toast)
   - The car should appear in the grid

2. **Edit the Car:**
   - Click the "Edit" (pencil) icon on the car card
   - Change Daily Rate to: 60
   - Click "Save Car"
   - You should see: "Car updated successfully"
   - The rate should update to $60

3. **Delete the Car:**
   - Click the "Delete" (trash) icon
   - Click "Delete" in the confirmation modal
   - You should see: "Car deleted successfully"
   - The car should disappear from the list

4. **Verify in Database:**
   - Go to Supabase: **Table Editor** → `cars`
   - Add a car through the UI, then check it appears here
   - Delete a car, then verify it's removed

### ✅ Success Criteria:
- Can add, edit, and delete cars
- All changes persist after refresh
- Data syncs with Supabase `cars` table

---

## 👥 Test 3: Customers Page

**URL:** http://localhost:3000/customers

### What to Test:
1. **First Visit:**
   - Page should load (will be empty initially)
   - You'll see: "No customers found"

2. **Add Test Customer via Supabase:**
   - Go to Supabase: **Table Editor** → `customers`
   - Click "+ Insert row"
   - Fill in:
     - `owner_id`: Copy your user ID from `profiles` table
     - `name`: "John Doe"
     - `email`: "john@example.com"
     - `phone`: "+1234567890"
   - Save
   - Refresh the Customers page
   - John Doe should appear

3. **Search & Filter:**
   - Add more customers
   - Try searching by name
   - Try sorting by name/email/bookings

### ✅ Success Criteria:
- Customers added via Supabase appear on the page
- Search and filters work correctly
- Data is read from `customers` table

---

## 📅 Test 4: Bookings Page

**URL:** http://localhost:3000/bookings

### What to Test:
1. **First Visit:**
   - Page should load (will be empty initially)
   - You'll see three sections:
     - Pending Bookings
     - Today's Bookings
     - All Bookings

2. **Add Test Booking via Supabase:**
   - First, make sure you have a car in `cars` table
   - First, make sure you have a customer in `customers` table
   - Go to Supabase: **Table Editor** → `bookings`
   - Click "+ Insert row"
   - Fill in:
     - `owner_id`: Your user ID
     - `car_id`: A car ID from `cars` table
     - `customer_id`: A customer ID from `customers` table
     - `pickup_date`: Today's date (e.g., `2025-11-25`)
     - `dropoff_date`: Future date (e.g., `2025-11-30`)
     - `total_price`: 250
     - `status`: "pending"
   - Save
   - Refresh the Bookings page
   - The booking should appear in "Pending Bookings"

3. **Review Booking:**
   - Click "Review" button on a pending booking
   - The detail panel should slide in from the right
   - You should see car and customer details
   - Try clicking "Accept" or "Reject" (if actions are implemented)

### ✅ Success Criteria:
- Bookings appear in correct sections based on status and date
- Detail panel opens and shows booking info
- Data is read from `bookings` table with car/customer relations

---

## 📆 Test 5: Calendar Page

**URL:** http://localhost:3000/calendar

### What to Test:
1. **View Modes:**
   - Switch between Month, Week, Day, and List views
   - Bookings should appear on the correct dates

2. **With Real Data:**
   - Make sure you have bookings in the database (from Test 4)
   - They should appear on the calendar
   - Click on a booking to see details

### ✅ Success Criteria:
- Calendar displays real bookings from database
- All view modes work correctly
- Bookings appear on correct pickup/dropoff dates

---

## 📊 Test 6: Dashboard

**URL:** http://localhost:3000/dashboard

### What to Test:
1. **Statistics:**
   - Should show real counts from database:
     - Total Cars (from `cars` table)
     - Active Bookings (from `bookings` where status != 'cancelled')
     - Total Revenue (sum of `total_price` from completed bookings)
     - Available Cars (from `cars` where status = 'available')

2. **Recent Bookings:**
   - Should show the 10 most recent bookings
   - Data comes from database, not dummy data

3. **Quick Actions:**
   - Click "Add Car" → should go to Cars page
   - Click "View Bookings" → should go to Bookings page
   - Click other quick action cards

### ✅ Success Criteria:
- Statistics reflect real database data
- Recent bookings are from database
- Quick actions work correctly

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch" or "Cannot read property"
**Cause:** Tables don't exist in Supabase
**Solution:**
1. Go to Supabase SQL Editor
2. Run `supabase-schema.sql` completely
3. Verify tables exist: Database → Tables

### Issue 2: "Row Level Security policy violation"
**Cause:** RLS policies not created
**Solution:**
1. Make sure `supabase-schema.sql` ran completely (it includes RLS policies)
2. Check: Database → Tables → Click a table → Policies tab
3. Should see policies for INSERT, SELECT, UPDATE, DELETE

### Issue 3: "Profile not found" or blank profile page
**Cause:** No profile row exists for your user
**Solution:**
The code automatically creates a default profile on first visit. Just refresh the page.

### Issue 4: Empty pages everywhere
**Cause:** No data in database yet
**Solution:**
This is normal! Start by:
1. Adding a car via the Cars page
2. Adding a customer via Supabase Table Editor
3. Adding a booking via Supabase Table Editor

### Issue 5: Changes don't persist after refresh
**Cause:** Data is not saving to Supabase
**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed requests
4. Verify your `.env.local` has correct credentials
5. Restart dev server: `npm run dev`

---

## 🔍 How to Verify Data in Supabase

### Method 1: Table Editor
1. Go to Supabase Dashboard
2. Click **"Table Editor"** in left sidebar
3. Select a table (profiles, cars, customers, bookings)
4. You should see your data here

### Method 2: SQL Editor
Run queries like:
```sql
-- See all your cars
SELECT * FROM cars WHERE owner_id = 'your-user-id';

-- See all your bookings
SELECT * FROM bookings WHERE owner_id = 'your-user-id';

-- Count your data
SELECT COUNT(*) FROM cars WHERE owner_id = 'your-user-id';
```

---

## ✅ Final Checklist

After testing, you should verify:

- [ ] Profile saves and loads correctly
- [ ] Can add/edit/delete cars
- [ ] Customers appear from database
- [ ] Bookings appear from database
- [ ] Calendar shows real bookings
- [ ] Dashboard shows real statistics
- [ ] All data persists after page refresh
- [ ] Data appears in Supabase Table Editor
- [ ] No console errors in browser (F12)

---

## 🎉 Success!

If all tests pass, your application is now fully connected to Supabase and ready to use with real data!

### Next Steps:
1. **Add more data** through the UI
2. **Test thoroughly** on different browsers
3. **Deploy to production** when ready
4. **Update production environment variables** with production Supabase credentials

---

**Need Help?**
- Check browser console for errors (F12)
- Check Supabase API Logs: Logs → API
- Verify environment variables are correct
- Make sure dev server is running: `npm run dev`

