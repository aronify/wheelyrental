# 📊 How to Add Sample Bookings and Customers

This guide will walk you through adding sample data to your Wheely database via Supabase.

---

## 🎯 Prerequisites

Before you start, make sure you have:
1. ✅ Access to your Supabase dashboard
2. ✅ At least one car added to your cars table
3. ✅ Your profile set up (with user_id)

---

## 📝 Step-by-Step Guide

### **Step 1: Get Your User ID**

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** in the left sidebar
3. Run this query:

```sql
SELECT user_id FROM profiles LIMIT 1;
```

4. **Copy the `user_id`** that appears (it looks like: `12345678-1234-1234-1234-123456789abc`)

---

### **Step 2: Get Your Car IDs**

1. Still in the **SQL Editor**, run this query (replace `YOUR_USER_ID_HERE` with your actual user_id from Step 1):

```sql
SELECT id, make, model, license_plate 
FROM cars 
WHERE owner_id = 'YOUR_USER_ID_HERE';
```

2. **Copy the car `id` values** - you'll need at least 1-3 car IDs

**Example result:**
```
id: abc123... | make: Toyota | model: Camry | license_plate: ABC123
id: def456... | make: Honda  | model: Civic | license_plate: XYZ789
```

---

### **Step 3: Add Sample Customers**

1. Open the `sample-data.sql` file from your project folder
2. **Replace ALL instances of `'YOUR_USER_ID_HERE'`** with your actual user_id
3. Copy the **CUSTOMERS section** (lines starting with `INSERT INTO customers`)
4. In Supabase SQL Editor, paste and run the query

**Example:**
```sql
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
    '12345678-1234-1234-1234-123456789abc',  -- Your actual user_id
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
  );
  -- Add more customers here...
```

5. ✅ Click **Run** - You should see "Success" message

---

### **Step 4: Get Customer IDs**

After adding customers, get their IDs:

```sql
SELECT id, first_name, last_name 
FROM customers 
WHERE owner_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC;
```

**Copy the customer IDs** - you'll need these for bookings.

---

### **Step 5: Add Sample Bookings**

1. Still in the `sample-data.sql` file, find the **BOOKINGS section**
2. **Replace the following in EACH booking:**
   - `'YOUR_USER_ID_HERE'` → Your actual user_id
   - `'YOUR_CAR_ID_1'` → An actual car id from Step 2
   - `'YOUR_CAR_ID_2'` → Another car id (or same one)
   - `'YOUR_CAR_ID_3'` → Another car id (or same one)
   - `'CUSTOMER_ID_1'` → An actual customer id from Step 4
   - `'CUSTOMER_ID_2'` → Another customer id
   - `'CUSTOMER_ID_3'` → Another customer id
   - etc.

**Example:**
```sql
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
  (
    '12345678-1234-1234-1234-123456789abc',  -- Your user_id
    'abc123-car-id-here',                     -- Your car id
    'def456-customer-id-here',                -- Your customer id
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '14 days',
    'Airport Terminal 1',
    'Airport Terminal 1',
    700.00,
    'confirmed',
    'Early morning pickup requested'
  );
  -- Add more bookings...
```

3. Copy and paste into Supabase SQL Editor
4. ✅ Click **Run**

---

## 🎨 Quick Method (Copy-Paste Template)

If you want to quickly add just a few records, use this template directly in Supabase:

### **Add One Customer:**
```sql
-- Replace YOUR_USER_ID with your actual user_id
INSERT INTO customers (
  owner_id, first_name, last_name, email, phone, 
  city, country, license_number, license_expiry_date
) VALUES (
  'YOUR_USER_ID',
  'Alice',
  'Johnson',
  'alice.johnson@example.com',
  '+1234567895',
  'San Francisco',
  'USA',
  'DL123789',
  '2027-12-31'
);
```

### **Add One Booking:**
```sql
-- Replace YOUR_USER_ID, YOUR_CAR_ID, and YOUR_CUSTOMER_ID
INSERT INTO bookings (
  owner_id, car_id, customer_id,
  pickup_date, dropoff_date, pickup_location,
  dropoff_location, total_price, status
) VALUES (
  'YOUR_USER_ID',
  'YOUR_CAR_ID',
  'YOUR_CUSTOMER_ID',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '10 days',
  'Downtown Office',
  'Airport Terminal',
  300.00,
  'confirmed'
);
```

---

## ✅ Verify Your Data

After adding data, verify everything works:

### **Check Customers:**
```sql
SELECT 
  first_name, 
  last_name, 
  email, 
  city, 
  created_at 
FROM customers 
WHERE owner_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### **Check Bookings:**
```sql
SELECT 
  b.status,
  b.pickup_date,
  b.dropoff_date,
  b.total_price,
  c.first_name || ' ' || c.last_name as customer_name,
  car.make || ' ' || car.model as car_name
FROM bookings b
JOIN customers c ON b.customer_id = c.id
JOIN cars car ON b.car_id = car.id
WHERE b.owner_id = 'YOUR_USER_ID'
ORDER BY b.pickup_date DESC;
```

---

## 🎯 Booking Status Types

When creating bookings, use these status values:
- **`pending`** - New booking awaiting approval
- **`confirmed`** - Approved booking
- **`picked_up`** - Customer has picked up the car
- **`returned`** - Car has been returned
- **`cancelled`** - Booking was cancelled

---

## 💡 Tips

1. **Date Range Tips:**
   - `CURRENT_DATE` = Today
   - `CURRENT_DATE + INTERVAL '7 days'` = One week from today
   - `CURRENT_DATE - INTERVAL '7 days'` = One week ago

2. **Test Different Scenarios:**
   - Add bookings with different statuses
   - Create some for past dates (completed bookings)
   - Create some for future dates (upcoming bookings)
   - Add bookings for today to test "Today's Bookings" section

3. **Realistic Data:**
   - Use realistic prices (daily_rate × number of days)
   - Add notes to make data more meaningful
   - Use different locations for variety

4. **Dashboard Testing:**
   - After adding data, refresh your Wheely dashboard
   - Check the Overview page for updated stats
   - View the Bookings page to see all bookings
   - Check the Customers page to see all customers
   - Look at the Calendar to see booking dates

---

## ❓ Troubleshooting

### **Error: "violates foreign key constraint"**
- Make sure the `owner_id` matches your actual user_id
- Make sure the `car_id` exists in your cars table
- Make sure the `customer_id` exists in your customers table

### **Error: "invalid input syntax for type uuid"**
- Make sure you're using actual UUIDs (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- Don't use placeholder text like `YOUR_USER_ID_HERE`

### **Data doesn't show up in the app**
- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check that the `owner_id` matches your logged-in user
- Verify data exists by running the verification queries above

---

## 🚀 Quick Start Commands

Run these in order in Supabase SQL Editor (after replacing YOUR_USER_ID with your actual ID):

```sql
-- 1. Get your user ID
SELECT user_id FROM profiles LIMIT 1;

-- 2. Get your car IDs
SELECT id, make, model FROM cars WHERE owner_id = 'YOUR_USER_ID';

-- 3. Add customers (use the INSERT statements from sample-data.sql)

-- 4. Get customer IDs
SELECT id, first_name, last_name FROM customers WHERE owner_id = 'YOUR_USER_ID';

-- 5. Add bookings (use the INSERT statements from sample-data.sql)

-- 6. Verify everything
SELECT COUNT(*) as total_bookings FROM bookings WHERE owner_id = 'YOUR_USER_ID';
SELECT COUNT(*) as total_customers FROM customers WHERE owner_id = 'YOUR_USER_ID';
```

---

## 🎉 Done!

After completing these steps, your Wheely dashboard should now display:
- ✅ Sample customers in the Customers page
- ✅ Sample bookings in the Bookings page
- ✅ Updated statistics in the Overview page
- ✅ Booking events in the Calendar
- ✅ Charts with actual data

Enjoy testing your fully functional car rental platform! 🚗✨

