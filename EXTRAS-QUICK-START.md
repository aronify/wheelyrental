# Quick Start Guide: Car Extras Feature

## 🚀 Get Started in 3 Steps

### Step 1: Run the SQL Migration
Copy and paste this SQL into your **Supabase SQL Editor** and run it:

**File:** `database/migrations/migration-create-car-extras.sql`

This creates:
- ✅ `extras` table (company-wide extras catalog)
- ✅ `car_extras` table (links cars to extras with pricing)
- ✅ Indexes for performance
- ✅ RLS policies for security
- ✅ Permissions for authenticated/anon roles

### Step 2: Verify Installation
Run this verification query in Supabase:

```sql
-- Quick verification
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('extras', 'car_extras')) as tables_created,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('extras', 'car_extras')) as policies_count,
  (SELECT COUNT(*) FROM information_schema.role_table_grants 
   WHERE table_name IN ('extras', 'car_extras') 
   AND grantee IN ('authenticated', 'anon')) as permissions_granted;
```

**Expected Result:**
- `tables_created`: 2
- `policies_count`: 8 (4 per table: SELECT, INSERT, UPDATE, DELETE)
- `permissions_granted`: 8 (SELECT, INSERT, UPDATE, DELETE × 2 tables × 2 roles)

### Step 3: Use the Feature
1. Go to **Cars** page
2. Click **"Add Vehicle"** or edit an existing car
3. Click the **"Extras"** tab (has a $ icon)
4. Click **"Create New Extra"**
5. Fill in:
   - Name: e.g., "GPS Navigation"
   - Description: e.g., "Portable GPS with European maps"
   - Price: e.g., 8.00
   - Unit: Select "Per Day"
6. Click **"Save Extra"**
7. The extra appears in the list - check it to assign to this car
8. Optionally adjust the price for this specific car
9. Check "Included in base rate" if it's free with this car
10. Click **"Save Changes"** at the bottom

## 💡 Common Extras to Create

```
GPS Navigation - €8/day
Child Seat - €5/day
Booster Seat - €4/day
Additional Driver - €10/booking
Full Insurance - €15/day
Winter Tires - €6/day
Ski Rack - €7/day
Bike Rack - €7/day
Phone Holder - €3/booking
USB Charger - €2/booking
```

## 🎯 How It Works

### For Admins
1. **Create extras once** - they become available company-wide
2. **Assign to cars** - select which extras each car offers
3. **Customize pricing** - override default price per car if needed
4. **Include or charge** - mark as included or as paid add-on

### For Customers (Future)
- See available extras when viewing a car
- Add extras to booking
- Clear pricing displayed
- Total cost calculated automatically

## 🔧 Troubleshooting

### "Permission denied for table extras"
**Solution:** Run the GRANT statements from the migration file:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.car_extras TO anon;
```

### Extras not appearing in car list
**Solution:** Check that:
1. Extras were saved successfully (check browser console)
2. Car has extras assigned in database:
```sql
SELECT * FROM car_extras WHERE car_id = 'YOUR_CAR_ID';
```

### Build errors
**Solution:** The build should pass. If not:
```bash
cd /Users/asulisufi/Dev/WheelyPartner
npm run build
```

## 📊 Database Tables

### `extras` Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | Links to your company |
| name | TEXT | Extra name (e.g., "GPS") |
| description | TEXT | Optional description |
| default_price | NUMERIC | Default price in € |
| unit | TEXT | per_day, per_booking, one_time |
| is_active | BOOLEAN | Soft delete flag |

### `car_extras` Table
| Column | Type | Description |
|--------|------|-------------|
| car_id | UUID | Links to car |
| extra_id | UUID | Links to extra |
| price | NUMERIC | Custom price for this car |
| is_included | BOOLEAN | True if included in base rate |

## 🎨 UI Features

### Extras Tab
- **Create new extras** - Add to company catalog
- **Select from list** - Checkbox interface
- **Custom pricing** - Override per car
- **Include toggle** - Mark as free
- **Visual feedback** - Selected items highlighted
- **Mobile responsive** - Works on all devices

### Car List Display
- **Extras badge** - Shows count in grid/list view
- **Blue badge** - Dollar icon with count
- **Clean design** - Matches existing UI

## 📁 Files to Reference

```
database/migrations/migration-create-car-extras.sql
  └─ Run this first in Supabase

lib/server/data/extras-data-actions.ts
  └─ Server actions for extras

app/components/domain/cars/car-form-modal.tsx
  └─ UI with Extras tab

types/car.ts
  └─ TypeScript types for extras
```

## ✅ Success Checklist

- [ ] SQL migration executed in Supabase
- [ ] Verification query shows correct counts
- [ ] Can create new extra in UI
- [ ] Extra appears in available list
- [ ] Can assign extra to car
- [ ] Can customize price for car
- [ ] Can toggle "included" status
- [ ] Extras badge shows in car list
- [ ] Build passes without errors

## 🎉 You're Done!

The car extras feature is now fully operational. You can:
1. Create company-wide extras catalog
2. Assign extras to specific cars
3. Customize pricing per car
4. Display extras to customers (when booking integration is added)

For detailed documentation, see: `CAR-EXTRAS-IMPLEMENTATION-SUMMARY.md`

---

**Need Help?**
- Check the browser console for errors
- Check Supabase logs for database errors
- Verify RLS policies are enabled
- Ensure permissions are granted
