# 📊 SUPER DETAILED GUIDE: How to Add Sample Data

Follow these exact steps to add customers and bookings to your database.

---

## 🎯 Your Information

✅ **User ID:** `6a33bf27-3ae8-4584-9384-21843311beb7`  
✅ **Car ID:** `aba736fb-8364-4d51-9983-119c4e6ceccb`

---

## 📋 Step-by-Step Instructions

### **STEP 1: Open Supabase SQL Editor**

1. Go to your browser and open [https://supabase.com](https://supabase.com)
2. **Sign in** to your account
3. Click on your **Wheely project** (or whatever you named it)
4. Look at the left sidebar
5. Click on **"SQL Editor"** (it has an icon that looks like `</>`)
6. You should see a blank SQL editor screen

**Screenshot location to look for:**
```
Left Sidebar:
- 🏠 Home
- 📊 Table Editor
- 🔐 Authentication
- 📁 Storage
- 💾 SQL Editor  ← Click this one!
- 🔧 Database
```

---

### **STEP 2: Add Customers First**

#### **2A. Copy the Customer Data**

1. Open the file `ready-to-use-sample-data.sql` from your Downloads/Wheely folder
2. Find the section that says **"STEP 1: ADD CUSTOMERS"**
3. **Select and copy** everything from line that starts with:
   ```sql
   INSERT INTO customers (
   ```
   All the way down to the line that ends with:
   ```sql
   );
   ```
   (This includes all 5 customers)

**TIP:** It should be about 60 lines of code starting with `INSERT INTO customers` and ending with `);`

#### **2B. Paste into Supabase**

1. Go back to your **Supabase SQL Editor** tab
2. **Click in the editor** (the big blank area)
3. **Paste** the code (Cmd+V on Mac, Ctrl+V on Windows)
4. You should see the INSERT INTO customers statement

#### **2C. Run the Query**

1. Look at the bottom-right corner of the SQL Editor
2. You'll see a button that says **"Run"** or **"Execute"**
3. **Click "Run"**
4. Wait 1-2 seconds

#### **2D. Check for Success**

You should see one of these messages:
- ✅ **"Success. No rows returned"** - This is GOOD!
- ✅ **"5 rows inserted"** - This is GOOD!
- ❌ **"Error: ..."** - See Troubleshooting section below

**If you see success, great! Continue to Step 3.**

---

### **STEP 3: Get Customer IDs**

Now you need to get the IDs of the customers you just created.

#### **3A. Clear the Editor**

1. In the SQL Editor, **select all** the text (Cmd+A on Mac, Ctrl+A on Windows)
2. **Delete it** (press Delete or Backspace)
3. The editor should be blank now

#### **3B. Copy the Query to Get Customer IDs**

Go back to `ready-to-use-sample-data.sql` and find this query:

```sql
SELECT 
  id,
  first_name,
  last_name,
  email
FROM customers 
WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7'
ORDER BY created_at DESC;
```

**Copy this entire query**

#### **3C. Run the Query**

1. **Paste** it into the SQL Editor
2. Click **"Run"**
3. You should now see a **table with 5 rows** showing:
   - id (a long UUID like `abc123-def456-...`)
   - first_name
   - last_name
   - email

#### **3D. Write Down the Customer IDs**

This is IMPORTANT! You need to copy these IDs.

**Open a text file** (Notes, TextEdit, Notepad, anything) and write:

```
John Smith: [paste his ID here]
Maria Garcia: [paste her ID here]
Ahmed Hassan: [paste his ID here]
Sophie Dubois: [paste her ID here]
Liam O'Brien: [paste his ID here]
```

**How to copy each ID:**
1. In the Supabase results table, **click on the ID** for John Smith
2. It should highlight or you can **triple-click to select it all**
3. **Copy it** (Cmd+C or Ctrl+C)
4. **Paste it** next to "John Smith:" in your text file
5. Repeat for all 5 customers

**Example of what it should look like:**
```
John Smith: 12345678-1234-1234-1234-123456789abc
Maria Garcia: 23456789-2345-2345-2345-234567890abc
Ahmed Hassan: 34567890-3456-3456-3456-345678901abc
Sophie Dubois: 45678901-4567-4567-4567-456789012abc
Liam O'Brien: 56789012-5678-5678-5678-567890123abc
```

**Keep this text file open!** You'll need these IDs in the next step.

---

### **STEP 4: Prepare the Bookings Data**

Now you'll add bookings for these customers.

#### **4A. Copy the Bookings Template**

1. Go back to `ready-to-use-sample-data.sql`
2. Find the section **"STEP 3: ADD BOOKINGS"**
3. **Copy** everything from:
   ```sql
   INSERT INTO bookings (
   ```
   Down to the very last:
   ```sql
   );
   ```

#### **4B. Paste into a Text Editor First**

**Don't paste into Supabase yet!**

1. Open a **new text file** (Notes, TextEdit, VS Code, anything)
2. **Paste** the bookings code there
3. Now you'll do a "find and replace" to add your customer IDs

#### **4C. Replace Customer IDs**

You'll see placeholders like:
- `'CUSTOMER_ID_FOR_JOHN'`
- `'CUSTOMER_ID_FOR_MARIA'`
- `'CUSTOMER_ID_FOR_AHMED'`
- `'CUSTOMER_ID_FOR_SOPHIE'`
- `'CUSTOMER_ID_FOR_LIAM'`

**Use Find & Replace:**

1. Press **Cmd+F (Mac)** or **Ctrl+F (Windows)**
2. Look for a "Replace" option or press **Cmd+H / Ctrl+H**
3. You'll see two boxes: "Find" and "Replace"

**Do this 5 times (once for each customer):**

**Replace #1 (John):**
- Find: `CUSTOMER_ID_FOR_JOHN`
- Replace with: `[paste John's actual ID here]`
- Click **"Replace All"**

**Replace #2 (Maria):**
- Find: `CUSTOMER_ID_FOR_MARIA`
- Replace with: `[paste Maria's actual ID here]`
- Click **"Replace All"**

**Replace #3 (Ahmed):**
- Find: `CUSTOMER_ID_FOR_AHMED`
- Replace with: `[paste Ahmed's actual ID here]`
- Click **"Replace All"**

**Replace #4 (Sophie):**
- Find: `CUSTOMER_ID_FOR_SOPHIE`
- Replace with: `[paste Sophie's actual ID here]`
- Click **"Replace All"**

**Replace #5 (Liam):**
- Find: `CUSTOMER_ID_FOR_LIAM`
- Replace with: `[paste Liam's actual ID here]`
- Click **"Replace All"**

#### **4D. Verify the Replacements**

Look through your code. You should now see lines like:

```sql
'aba736fb-8364-4d51-9983-119c4e6ceccb',  -- car_id
'12345678-1234-1234-1234-123456789abc',  -- customer_id (John's real ID)
```

**Make sure there are NO MORE instances of:**
- `CUSTOMER_ID_FOR_JOHN`
- `CUSTOMER_ID_FOR_MARIA`
- etc.

All should be replaced with actual UUIDs!

---

### **STEP 5: Add Bookings to Database**

#### **5A. Copy Your Updated Bookings Code**

1. In your text editor, **select all** the bookings code (Cmd+A / Ctrl+A)
2. **Copy it** (Cmd+C / Ctrl+C)

#### **5B. Paste into Supabase**

1. Go back to **Supabase SQL Editor**
2. **Clear** the editor (select all and delete)
3. **Paste** your bookings code
4. **Double-check** that you see real UUIDs (not CUSTOMER_ID_FOR_...)

#### **5C. Run the Query**

1. Click **"Run"** at the bottom-right
2. Wait 2-3 seconds

#### **5D. Check for Success**

You should see:
- ✅ **"Success. 8 rows inserted"** - Perfect!
- ✅ **"Success. No rows returned"** - Also good!
- ❌ **Error** - See troubleshooting below

---

### **STEP 6: Verify Everything Worked**

Let's check that your data is in the database!

#### **6A. Check Customers**

1. **Clear** the SQL Editor
2. **Copy and paste** this query:

```sql
SELECT 
  first_name,
  last_name,
  email,
  city,
  phone
FROM customers 
WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7';
```

3. Click **"Run"**
4. You should see **5 customers** listed

#### **6B. Check Bookings**

1. **Clear** the SQL Editor
2. **Copy and paste** this query:

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
WHERE b.owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7'
ORDER BY b.pickup_date DESC;
```

3. Click **"Run"**
4. You should see **8 bookings** with:
   - Status (pending, confirmed, picked_up, returned, cancelled)
   - Dates
   - Prices
   - Customer names
   - Car information

**If you see all 8 bookings, you're done! 🎉**

---

### **STEP 7: Check Your Dashboard**

Now let's see the data in your Wheely app!

1. Go to your browser
2. Open your Wheely app (localhost:3000 or your deployed URL)
3. **Log in** if needed
4. You should see:

**Overview Page:**
- Updated statistics
- Charts with data
- Recent bookings list

**Bookings Page:**
- All 8 bookings displayed
- Different statuses (confirmed, pending, etc.)
- Today's bookings section

**Customers Page:**
- All 5 customers displayed
- Customer cards with information

**Calendar Page:**
- Booking dates marked on calendar
- Color-coded events

**If you see all this data, SUCCESS! 🎉🎉🎉**

---

## ⚠️ Troubleshooting

### **Error: "violates foreign key constraint on owner_id"**

**Problem:** The user_id doesn't match your actual user.

**Solution:**
1. Double-check that you're logged in with the correct account
2. Run this to get your real user_id:
   ```sql
   SELECT user_id FROM profiles LIMIT 1;
   ```
3. If it's different from `6a33bf27-3ae8-4584-9384-21843311beb7`, you'll need to update all the queries

---

### **Error: "violates foreign key constraint on car_id"**

**Problem:** The car_id doesn't exist in your database.

**Solution:**
1. Check if you have the car in your database:
   ```sql
   SELECT id, make, model FROM cars WHERE id = 'aba736fb-8364-4d51-9983-119c4e6ceccb';
   ```
2. If nothing shows up, either:
   - Add a car through the Wheely app first
   - Or update the car_id in the bookings to use a car you actually have

---

### **Error: "violates foreign key constraint on customer_id"**

**Problem:** You didn't replace the customer ID placeholders, or you used the wrong IDs.

**Solution:**
1. Make sure you replaced ALL instances of `CUSTOMER_ID_FOR_JOHN`, etc.
2. Make sure you copied the FULL UUID (including dashes)
3. Make sure the customer IDs are wrapped in single quotes: `'abc-123-...'`

---

### **Error: "invalid input syntax for type uuid"**

**Problem:** The UUID format is wrong.

**Solution:**
- UUIDs must look like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Must have exactly 5 groups separated by dashes
- Must be wrapped in single quotes: `'...'`
- Must have NO spaces

---

### **Data doesn't show up in the app**

**Solutions:**
1. **Hard refresh** your browser:
   - Mac: Cmd + Shift + R
   - Windows: Ctrl + Shift + R
2. **Log out and log back in**
3. **Check the SQL verification queries** to make sure data is in the database
4. **Clear browser cache** if still not showing

---

## 📝 Quick Reference

### **Your IDs:**
```
User ID:  6a33bf27-3ae8-4584-9384-21843311beb7
Car ID:   aba736fb-8364-4d51-9983-119c4e6ceccb
```

### **File to Use:**
```
ready-to-use-sample-data.sql
```

### **Order of Operations:**
1. ✅ Add customers (Step 2)
2. ✅ Get customer IDs (Step 3)
3. ✅ Replace customer IDs in bookings (Step 4)
4. ✅ Add bookings (Step 5)
5. ✅ Verify data (Step 6)
6. ✅ Check dashboard (Step 7)

---

## 🎯 Summary Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied and ran customers INSERT statement
- [ ] Got all 5 customer IDs and wrote them down
- [ ] Copied bookings template to text editor
- [ ] Replaced all 5 customer ID placeholders
- [ ] Verified no placeholders remain
- [ ] Ran bookings INSERT statement in Supabase
- [ ] Verified customers query shows 5 customers
- [ ] Verified bookings query shows 8 bookings
- [ ] Checked Wheely dashboard and saw data
- [ ] Celebrated! 🎉

---

## 💡 Pro Tips

1. **Use Command/Ctrl + F** to search for text - very helpful!
2. **Take your time** - accuracy is more important than speed
3. **Save your customer IDs** in a text file - you might need them later
4. **Test one customer first** if you're nervous - you can always add more
5. **Screenshot your customer IDs** as backup

---

## 🆘 Still Need Help?

If you're stuck:

1. **Check the error message** - it usually tells you what's wrong
2. **Re-read the step** you're on carefully
3. **Check your IDs** - 90% of errors are from wrong IDs
4. **Try the verification queries** - they show if data exists
5. **Start over** - delete customers and bookings and try again:

```sql
-- Delete all bookings (run this first)
DELETE FROM bookings WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Delete all customers (run this second)
DELETE FROM customers WHERE owner_id = '6a33bf27-3ae8-4584-9384-21843311beb7';
```

Then start from Step 2 again!

---

## 🎉 You're Done!

Once you see data in your dashboard, you've successfully:
- ✅ Added 5 sample customers
- ✅ Added 8 sample bookings
- ✅ Populated your charts with data
- ✅ Made your dashboard look amazing!

Enjoy your fully functional car rental platform! 🚗✨

