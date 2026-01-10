# Final Migration Checklist for Car Locations

## Problem Summary
- Locations sent from form but returned as `undefined`
- Error: "permission denied for table car_locations"
- Root cause: PostgreSQL roles lack permissions on `car_locations` table

## Solution: Run These Scripts in Order

### Step 1: Create Junction Table (if not exists)
```sql
-- File: database/migrations/migration-create-car-locations-junction.sql
-- Run in Supabase SQL Editor
```

### Step 2: Grant Permissions (CRITICAL - This fixes the error)
```sql
-- File: database/migrations/grant-car-locations-permissions.sql
-- Run in Supabase SQL Editor

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_locations TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
```

### Step 3: Apply RLS Policies
```sql
-- File: database/rls-policies/rls-car-locations-policies.sql
-- Run in Supabase SQL Editor
```

### Step 4: Migrate Existing Data
```sql
-- File: database/migrations/migration-migrate-text-arrays-to-junction.sql
-- Run in Supabase SQL Editor
```

## Verification

### Check Permissions
```sql
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'car_locations'
  AND grantee IN ('authenticated', 'anon');
```
Expected: Both roles should have SELECT, INSERT, UPDATE, DELETE

### Check RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'car_locations';
```
Expected: `rowsecurity = true` (or `false` if you disabled it for testing)

### Check Policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'car_locations';
```
Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

## Testing

1. Edit a car and add locations
2. Save the car
3. Check browser console - should show success
4. Reload page
5. Verify locations are still there

## Optimization Notes

The current implementation:
- ✅ Uses junction table for proper referential integrity
- ✅ Validates company ownership at application level
- ✅ Uses indexed queries for performance
- ✅ Atomic updates (delete + insert in transaction)
- ✅ Proper error handling and logging

## Rollback

If issues occur:
1. Locations are still stored in TEXT[] columns (backward compatible)
2. Can revert server actions to use TEXT[] if needed
3. Junction table doesn't break existing functionality


