# Complete Implementation Guide: Car Locations Junction Table

## Overview

This guide provides step-by-step instructions to migrate from TEXT[] arrays to the `car_locations` junction table for proper location persistence.

## Step 1: Run Database Migrations

### 1.1 Create Junction Table (if not exists)
```bash
# Run in Supabase SQL Editor:
database/migrations/migration-create-car-locations-junction.sql
```

### 1.2 Migrate Existing Data
```bash
# Run in Supabase SQL Editor:
database/migrations/migration-migrate-text-arrays-to-junction.sql
```

### 1.3 Verify RLS Policies
```bash
# Ensure these policies exist in:
database/rls-policies/rls-security-policies.sql
# Lines 598-646 should have car_locations policies
```

## Step 2: Update Server Actions

### 2.1 Helper Functions (Already Added)
The following helper functions have been added to `lib/server/data/cars-data-actions.ts`:
- `validateAndFilterLocationIds()` - Validates locations exist, belong to same company, and have correct type flags
- `updateCarLocationsJunction()` - Atomically updates junction table
- `fetchCarLocationIds()` - Fetches location IDs from junction table

### 2.2 Update `updateCarAction`

**Replace the location handling section** (starting around line 1142) with:

```typescript
// Handle locations using junction table (car_locations)
console.log('[updateCarAction] Processing locations via junction table:', {
  hasPickupLocations: !!carData.pickupLocations,
  pickupLocations: carData.pickupLocations,
  hasDropoffLocations: !!carData.dropoffLocations,
  dropoffLocations: carData.dropoffLocations,
})

let validatedPickupIds: string[] = []
let validatedDropoffIds: string[] = []

// Validate and filter location IDs if provided
if (carData.pickupLocations !== undefined) {
  try {
    validatedPickupIds = await validateAndFilterLocationIds(
      supabase,
      carData.pickupLocations,
      existingCar.company_id,
      'pickup'
    )
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to validate pickup locations' }
  }
}

if (carData.dropoffLocations !== undefined) {
  try {
    validatedDropoffIds = await validateAndFilterLocationIds(
      supabase,
      carData.dropoffLocations,
      existingCar.company_id,
      'dropoff'
    )
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to validate dropoff locations' }
  }
}

// Update car basic fields (DO NOT include pickup_locations/dropoff_locations)
const { error: updateError } = await withSupabaseTimeout(
  supabase
    .from('cars')
    .update(carUpdateData)
    .eq('id', carId),
  TIMEOUTS.UPDATE,
  'Failed to update car. The request timed out. Please try again.'
)

if (updateError) {
  // ... error handling ...
}

// Update car_locations junction table atomically
try {
  await updateCarLocationsJunction(
    supabase,
    carId,
    validatedPickupIds,
    validatedDropoffIds
  )
} catch (error) {
  return { error: error instanceof Error ? error.message : 'Car updated but failed to save locations. Please try again.' }
}

// Fetch car and locations
const { data, error: fetchError } = await withSupabaseTimeout(
  supabase
    .from('cars')
    .select(`id, company_id, make, model, year, license_plate, color, transmission, fuel_type, seats, daily_rate, deposit_required, status, image_url, features, created_at, updated_at`)
    .eq('id', carId)
    .maybeSingle(),
  TIMEOUTS.QUERY,
  'Failed to fetch updated car. The request timed out. Please try again.'
)

// Fetch locations from junction table
const { pickup: fetchedPickupIds, dropoff: fetchedDropoffIds } = await fetchCarLocationIds(supabase, carId)

// Verify locations were saved correctly
const pickupMatch = JSON.stringify(fetchedPickupIds.sort()) === JSON.stringify(validatedPickupIds.sort())
const dropoffMatch = JSON.stringify(fetchedDropoffIds.sort()) === JSON.stringify(validatedDropoffIds.sort())

if (!pickupMatch || !dropoffMatch) {
  return { error: 'Car was updated but locations were not saved correctly. Please try again.' }
}

// Transform car data with locations from junction table
const transformedCar = {
  // ... other fields ...
  pickupLocations: fetchedPickupIds.length > 0 ? fetchedPickupIds : undefined,
  dropoffLocations: fetchedDropoffIds.length > 0 ? fetchedDropoffIds : undefined,
  // ... other fields ...
}
```

### 2.3 Update `addCarAction`

Similar changes needed - after creating car, use `updateCarLocationsJunction()` instead of setting TEXT[] arrays.

### 2.4 Update Car Fetching

In `app/cars/page.tsx`, replace TEXT[] reading with junction table query:

```typescript
// Instead of reading pickup_locations/dropoff_locations from cars table,
// fetch from car_locations junction table:

const { data: carLocations } = await supabase
  .from('car_locations')
  .select('location_id, location_type')
  .eq('car_id', car.id)

const pickupIds = carLocations
  ?.filter(cl => cl.location_type === 'pickup')
  .map(cl => cl.location_id) || []

const dropoffIds = carLocations
  ?.filter(cl => cl.location_type === 'dropoff')
  .map(cl => cl.location_id) || []
```

## Step 3: Testing Checklist

- [ ] Run migrations successfully
- [ ] Existing cars have locations migrated to junction table
- [ ] Adding car with locations saves correctly
- [ ] Editing car locations saves correctly
- [ ] Locations persist after page reload
- [ ] Invalid location IDs are rejected
- [ ] Cross-company location assignment is blocked
- [ ] Type mismatch (pickup location used as dropoff) is rejected
- [ ] RLS policies prevent unauthorized access
- [ ] Performance: Querying cars by location is efficient

## Step 4: Rollback Plan

If issues occur:

1. **Keep TEXT[] columns** - They remain in schema for backward compatibility
2. **Junction table is additive** - Doesn't break existing code
3. **Can revert server actions** - Old code will still work with TEXT[] columns
4. **Migration is idempotent** - Safe to re-run

## Key Benefits

1. **Referential Integrity**: Foreign keys ensure locations exist
2. **Company Validation**: Enforced at database level
3. **Type Safety**: UUID foreign keys instead of TEXT[]
4. **Query Performance**: Indexed joins vs array scans
5. **Audit Trail**: `created_at`/`updated_at` per association
6. **Scalability**: Efficient queries for "cars at location X"

