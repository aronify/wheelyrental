# 🔍 Debugging Customers Not Showing

Let's figure out why customers aren't appearing. Follow these steps:

---

## Step 1: Verify Data is in Database

1. Go to **Supabase Dashboard**
2. Click **SQL Editor**
3. Copy and paste this query:

```sql
SELECT 
  id,
  user_id,
  name,
  email,
  city,
  created_at
FROM customers 
WHERE user_id = '6a33bf27-3ae8-4584-9384-21843311beb7';
```

4. Click **Run**

### ❓ What do you see?

**Option A:** You see 5 rows (John, Maria, Ahmed, Sophie, Liam)
- ✅ Data is in database! Go to Step 2.

**Option B:** You see 0 rows / "No rows returned"
- ❌ Data is NOT in database. Go to Step 1B below.

**Option C:** Error message
- Tell me the error and I'll fix it!

---

## Step 1B: If No Data Shows Up

Run this query to see ALL customers:

```sql
SELECT 
  id,
  user_id,
  name,
  email
FROM customers 
ORDER BY created_at DESC;
```

### ❓ What do you see?

**Option A:** You see customers but with a DIFFERENT user_id
- The insert used the wrong user_id. We need to either:
  - Delete them and re-insert with correct user_id
  - Update them to use your correct user_id

**Option B:** You see 0 rows
- The INSERT didn't work. We need to run it again.

---

## Step 2: Check Browser Console for Errors

1. Open your Wheely app in the browser
2. Press **F12** (or Right-click → Inspect)
3. Click the **Console** tab
4. Refresh the page (Cmd+R or Ctrl+R)
5. Look for RED error messages

### Common Errors:

**"Failed to fetch customers"**
- Database connection issue

**"RLS policy violation"** or **"permission denied"**
- Row Level Security blocking access

**"column does not exist"**
- Schema mismatch

**No errors at all:**
- Go to Step 3

---

## Step 3: Check Network Tab

1. Still in browser DevTools (F12)
2. Click **Network** tab
3. Refresh the page
4. Look for requests to Supabase
5. Click on the request that fetches customers
6. Check the **Response** tab

### ❓ What does the response show?

**Empty array `[]`:**
- Query is working but returning no data
- Check RLS policies (Step 4)

**Error message:**
- Tell me the error!

**Timeout or network error:**
- Supabase connection issue

---

## Step 4: Check Row Level Security (RLS)

Your customers table has RLS enabled, which might be blocking access.

### Check Current Policies:

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Policies**
3. Find the **customers** table
4. Check what policies exist

### Fix: Temporarily Disable RLS (for testing)

**⚠️ ONLY DO THIS FOR TESTING! Re-enable after!**

Run this in SQL Editor:

```sql
-- Disable RLS temporarily
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
```

Then refresh your app. Do customers show up now?

**If YES:** RLS was the problem. We need to add proper policies.
**If NO:** Continue to Step 5.

---

## Step 5: Check Your Login Session

Make sure you're logged in with the correct account:

1. In SQL Editor, run:

```sql
SELECT auth.uid() as current_user_id;
```

2. Compare this to your expected user_id: `6a33bf27-3ae8-4584-9384-21843311beb7`

### ❓ Do they match?

**YES:** Session is correct, continue to Step 6
**NO:** You're logged in with a different account! Log out and log back in.

---

## Step 6: Check the Customers Component

Let's see what data the component is receiving:

1. Open `app/customers/page.tsx`
2. Add this line after line 50 (before the return statement):

```typescript
console.log('Customers data:', customers)
```

3. Save the file
4. Refresh your browser
5. Check the browser console

### ❓ What do you see in console?

**`Customers data: []` (empty array):**
- Query is running but returning nothing
- RLS issue or wrong user_id in query

**`Customers data: [Object, Object, ...]` (array with objects):**
- Data IS being fetched!
- Issue is in the display component
- Go to Step 7

**`Customers data: null` or `undefined`:**
- Query is failing
- Check for errors

---

## Step 7: Force Refresh Server Component

Next.js might be caching the page. Let's force a rebuild:

1. Stop your development server (if running)
2. Run these commands:

```bash
rm -rf .next
npm run dev
```

3. Wait for it to finish building
4. Refresh your browser
5. Check customers page

---

## 🔧 Quick Fixes to Try

### Fix 1: Add RLS Policy

If RLS is blocking, add this policy:

```sql
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Fix 2: Check Table Name

Make sure the table is called `customers` (plural), not `customer`:

```sql
SELECT tablename FROM pg_tables WHERE tablename LIKE '%customer%';
```

### Fix 3: Re-insert Customers with Correct ID

If customers have wrong user_id, delete and re-insert:

```sql
-- Delete old customers
DELETE FROM customers WHERE user_id = '6a33bf27-3ae8-4584-9384-21843311beb7';

-- Then run the INSERT from FIXED-ready-to-use-sample-data.sql again
```

---

## 📋 Information I Need

To help you further, please tell me:

1. **Step 1 Result:** Do you see customers in the database query?
   - [ ] Yes, I see 5 customers
   - [ ] No, I see 0 customers
   - [ ] I see customers but with different user_id

2. **Browser Console:** Any red errors?
   - [ ] Yes (please copy the error)
   - [ ] No errors

3. **Step 6 Result:** What does `console.log` show?
   - [ ] Empty array `[]`
   - [ ] Array with objects
   - [ ] null/undefined
   - [ ] Didn't check yet

4. **Are you logged in?** 
   - [ ] Yes
   - [ ] Not sure

---

## 🆘 Emergency: Start Fresh

If nothing works, let's start completely fresh:

```sql
-- 1. Delete all existing customers
DELETE FROM customers;

-- 2. Disable RLS temporarily
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 3. Re-run the INSERT from FIXED-ready-to-use-sample-data.sql

-- 4. Verify they're there
SELECT * FROM customers;

-- 5. Re-enable RLS and add policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);
```

Then refresh your app!

