# Locations RLS Fix - Summary

## ✅ **Current Status**

1. **Policies are CORRECT** ✅
   - Using: `auth.jwt() -> 'user_metadata' ->> 'company_id'`
   - All 4 policies (SELECT, INSERT, UPDATE, DELETE) are set correctly

2. **user_metadata is populated** ✅
   - Your user has `company_id` in `user_metadata`
   - Verified: `user_metadata_company_id` matches `company_id`

3. **JWT is MISSING company_id** ❌
   - When you query `auth.jwt() -> 'user_metadata' ->> 'company_id'`, it returns NULL
   - This is because **JWT tokens are only refreshed on login**

## 🔧 **The Problem**

Even though:
- ✅ Policies are correct
- ✅ user_metadata has company_id
- ✅ Code uses anon key (not service_role)

The JWT token in your current session was issued **BEFORE** we updated user_metadata, so it doesn't contain `company_id`.

## ✅ **The Solution**

**Users must RE-LOGIN** to get a fresh JWT token that includes `company_id` in `user_metadata`.

## 📋 **Steps to Fix**

### Step 1: Verify user_metadata is set (already done ✅)
```sql
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'company_id' as company_id_in_metadata
FROM auth.users u
WHERE u.raw_user_meta_data->>'company_id' IS NOT NULL;
```

### Step 2: Re-login in your app
1. **Log out** from your Next.js app
2. **Log back in** with the same credentials
3. This will issue a **new JWT token** with `user_metadata.company_id`

### Step 3: Verify JWT after re-login
After re-login, the JWT should contain `company_id`. You can test this by:

**Option A: Add a test endpoint in your app**
```typescript
// app/api/test-jwt/route.ts
import { createServerActionClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' })
  }

  // This will show the JWT claims
  const { data } = await supabase.rpc('get_jwt_claims')
  
  return NextResponse.json({
    userId: user.id,
    companyIdFromJWT: data?.company_id,
    fullJWT: data
  })
}
```

**Option B: Check in browser console**
After re-login, open browser console and check:
```javascript
// The JWT is in cookies, but you can test by making a query
// that uses auth.jwt() in RLS
```

### Step 4: Test locations visibility
After re-login:
1. Go to `/locations` page
2. You should **only** see locations from your company
3. Other companies' locations should be **hidden**

## 🎯 **Expected Result After Re-Login**

- ✅ `auth.jwt() -> 'user_metadata' ->> 'company_id'` returns your company_id
- ✅ RLS policies filter locations correctly
- ✅ You only see your company's locations
- ✅ Other companies' locations are hidden

## ⚠️ **Why You Can See All Locations Now**

If you're currently seeing all locations, it might be because:
1. **You haven't re-logged in yet** (most likely)
2. **The app is using a cached session** (clear cookies and re-login)
3. **RLS is not enforcing** (but policies look correct, so unlikely)

## 🔍 **Debugging**

If after re-login you still see all locations:

1. **Check if JWT has company_id:**
   ```sql
   -- Run this from your app (not SQL Editor)
   SELECT auth.jwt() -> 'user_metadata' ->> 'company_id';
   ```

2. **Check RLS is enabled:**
   ```sql
   SELECT rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'locations';
   ```

3. **Check policies are active:**
   ```sql
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'locations';
   ```

## ✅ **Final Checklist**

- [ ] user_metadata has company_id ✅ (verified)
- [ ] Policies use user_metadata.company_id ✅ (verified)
- [ ] Code uses anon key ✅ (verified)
- [ ] **User has re-logged in** ⚠️ (required)
- [ ] JWT contains company_id ⚠️ (check after re-login)
- [ ] Locations are filtered correctly ⚠️ (test after re-login)

---

**Next Step: Re-login and test!** 🚀

