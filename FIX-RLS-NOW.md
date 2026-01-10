# 🔧 FIX RLS POLICIES - URGENT

## 🚨 ISSUE
RLS (Row Level Security) policies are blocking car saves.

## ✅ SOLUTION READY

I've created a comprehensive fix script that will:
1. ✅ Grant all necessary permissions
2. ✅ Enable RLS on all tables
3. ✅ Drop old/conflicting policies (clean slate)
4. ✅ Create correct RLS policies for:
   - `companies` table
   - `cars` table
   - `extras` table
   - `car_extras` table
5. ✅ Verify everything is working
6. ✅ Include test queries

---

## 🚀 HOW TO FIX (2 minutes)

### Step 1: Run the Fix Script

**File**: `database/migrations/fix-rls-policies-complete.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the **ENTIRE** contents of `fix-rls-policies-complete.sql`
3. Paste into SQL Editor
4. Click **Run**

### Step 2: Check the Output

The script will show you:
- ✅ Permissions granted
- ✅ Policies created
- ✅ Your company details
- ✅ Verification results

### Step 3: Test Adding a Car

After running the script:
1. Go to your app
2. Try adding a car
3. It should save successfully! ✅

---

## 📋 WHAT THE SCRIPT DOES

### 1. Grants Permissions
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cars TO anon;
-- (and same for extras, car_extras, companies, locations)
```

### 2. Drops Old Policies (Clean Slate)
```sql
DROP POLICY IF EXISTS "cars_select_policy" ON public.cars;
DROP POLICY IF EXISTS "cars_insert_policy" ON public.cars;
-- etc.
```

### 3. Creates Correct Policies
```sql
-- Allow users to insert cars for their company
CREATE POLICY "cars_insert_policy" ON public.cars
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  );
```

This ensures:
- ✅ You can only add cars to YOUR company
- ✅ You can only see/edit cars from YOUR company
- ✅ Other companies can't see your cars

---

## 🧪 AFTER RUNNING THE SCRIPT

### Test Query (included in script)
```sql
-- Try to insert a test car
INSERT INTO public.cars (
  company_id,
  make, model, year, license_plate,
  transmission, fuel_type, seats, daily_rate, status
) VALUES (
  (SELECT id FROM public.companies WHERE owner_id = auth.uid() LIMIT 1),
  'Test Make', 'Test Model', 2024, 'TEST123',
  'automatic', 'petrol', 5, 50.00, 'active'
)
RETURNING *;
```

If this returns a car record, **you're fixed!** ✅

---

## 🔍 TROUBLESHOOTING

### If it still doesn't work:

**Check 1: Do you have a company?**
```sql
SELECT * FROM public.companies WHERE owner_id = auth.uid();
```

If empty, create one:
```sql
INSERT INTO public.companies (name, owner_id)
VALUES ('My Rental Company', auth.uid())
RETURNING *;
```

**Check 2: Are policies created?**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'cars';
```

Should show:
- cars_select_policy
- cars_insert_policy
- cars_update_policy
- cars_delete_policy

**Check 3: Are permissions granted?**
```sql
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'cars' AND grantee = 'authenticated';
```

Should show: SELECT, INSERT, UPDATE, DELETE

---

## 📊 YOUR EXTRAS DATA

Good news! Your extras table works:
```json
{
  "id": "63ed4cfe-7934-471d-972d-71c3d28d1032",
  "name": "Child Seat",
  "default_price": "8.00",
  "unit": "per_day"
}
```

Once RLS is fixed, you'll be able to:
- ✅ Add cars
- ✅ Assign extras to cars
- ✅ Set custom prices per car

---

## 🎯 QUICK SUMMARY

1. **Run**: `database/migrations/fix-rls-policies-complete.sql` in Supabase SQL Editor
2. **Check**: Output shows policies created ✅
3. **Test**: Add a car from your app
4. **Success**: Car saves and appears in list! 🎉

---

## 📞 IF YOU STILL HAVE ISSUES

After running the script, if you still can't save cars:

1. **Share the error message** from browser console
2. **Run this query** and share the result:
   ```sql
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'cars';
   ```
3. **Check browser Network tab** - look for the failed request to `/api/cars` or similar

---

**File to run**: `database/migrations/fix-rls-policies-complete.sql`

This will fix your RLS issues and allow cars to save! 🚀
