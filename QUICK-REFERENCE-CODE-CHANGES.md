# Quick Reference: Code Changes Required

## Critical Change: Update `updateCarAction`

**File**: `lib/server/data/cars-data-actions.ts`  
**Location**: Around line 1142-1469 (the location handling section)

### What to Replace

**REMOVE**: All code that sets `carUpdateData.pickup_locations` and `carUpdateData.dropoff_locations`  
**REMOVE**: All code that reads `data.pickup_locations` and `data.dropoff_locations` from cars table  
**ADD**: Junction table operations using helper functions

### Exact Replacement Code

Replace the section starting with `// Add pickup_locations and dropoff_locations TEXT[] arrays` (line ~1142) through the transformation section (line ~1435) with:

```typescript
// Handle locations using junction table (car_locations)
// This provides referential integrity, company validation, and type checking
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
    console.log('[updateCarAction] Validated pickup locations:', validatedPickupIds)
  } catch (error) {
    console.error('[updateCarAction] Error validating pickup locations:', error)
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
    console.log('[updateCarAction] Validated dropoff locations:', validatedDropoffIds)
  } catch (error) {
    console.error('[updateCarAction] Error validating dropoff locations:', error)
    return { error: error instanceof Error ? error.message : 'Failed to validate dropoff locations' }
  }
}

// Update car basic fields (DO NOT include pickup_locations/dropoff_locations in carUpdateData)
console.log('[updateCarAction] Executing UPDATE query for car:', carId)

const { error: updateError } = await withSupabaseTimeout(
  supabase
    .from('cars')
    .update(carUpdateData)
    .eq('id', carId),
  TIMEOUTS.UPDATE,
  'Failed to update car. The request timed out. Please try again.'
)

if (updateError) {
  console.error('[updateCarAction] Update error:', {
    code: updateError.code,
    message: updateError.message,
    details: updateError.details,
    hint: updateError.hint,
  })
  // Handle specific database errors
  if (updateError.code === '23505') { // Unique violation
    return { error: `A car with this license plate already exists` }
  }
  if (updateError.code === '23514') { // Check constraint violation
    return { error: `Invalid data: ${updateError.message}` }
  }
  return { error: `Failed to update car: ${updateError.message}` }
}

// Update car_locations junction table atomically
// This replaces all existing location associations with the new ones
try {
  await updateCarLocationsJunction(
    supabase,
    carId,
    validatedPickupIds,
    validatedDropoffIds
  )
  console.log('[updateCarAction] ✅ Junction table updated successfully')
} catch (error) {
  console.error('[updateCarAction] Error updating junction table:', error)
  // Car was updated but locations failed - this is a partial failure
  return { error: error instanceof Error ? error.message : 'Car updated but failed to save locations. Please try again.' }
}

// Fetch the updated car (without location arrays)
console.log('[updateCarAction] Fetching updated car with locations...')
const { data, error: fetchError } = await withSupabaseTimeout(
  supabase
    .from('cars')
    .select(`
      id,
      company_id,
      make,
      model,
      year,
      license_plate,
      color,
      transmission,
      fuel_type,
      seats,
      daily_rate,
      deposit_required,
      status,
      image_url,
      features,
      created_at,
      updated_at
    `)
    .eq('id', carId)
    .maybeSingle(),
  TIMEOUTS.QUERY,
  'Failed to fetch updated car. The request timed out. Please try again.'
)

if (fetchError) {
  console.error('[updateCarAction] Error fetching car after update:', fetchError)
  return { error: `Failed to fetch updated car: ${fetchError.message}` }
}

if (!data) {
  return { error: 'Car not found after update. It may have been deleted or you may not have permission to view it.' }
}

// Fetch locations from junction table
const { pickup: fetchedPickupIds, dropoff: fetchedDropoffIds } = await fetchCarLocationIds(supabase, carId)

console.log('[updateCarAction] Fetched locations from junction table:', {
  pickup: fetchedPickupIds,
  dropoff: fetchedDropoffIds,
  pickupMatch: JSON.stringify(fetchedPickupIds.sort()) === JSON.stringify(validatedPickupIds.sort()),
  dropoffMatch: JSON.stringify(fetchedDropoffIds.sort()) === JSON.stringify(validatedDropoffIds.sort()),
})

// Verify locations were saved correctly
const pickupMatch = JSON.stringify(fetchedPickupIds.sort()) === JSON.stringify(validatedPickupIds.sort())
const dropoffMatch = JSON.stringify(fetchedDropoffIds.sort()) === JSON.stringify(validatedDropoffIds.sort())

if (!pickupMatch || !dropoffMatch) {
  console.error('[updateCarAction] ⚠️ Location mismatch after save!', {
    expected: {
      pickup: validatedPickupIds,
      dropoff: validatedDropoffIds,
    },
    actual: {
      pickup: fetchedPickupIds,
      dropoff: fetchedDropoffIds,
    },
    pickupMatch,
    dropoffMatch,
  })
  return { error: 'Car was updated but locations were not saved correctly. Please try again.' }
}

console.log('[updateCarAction] ✅ All locations verified - saved correctly!')

// Transform the returned car data to match Car interface (camelCase)
const transformedCar = {
  id: data.id,
  companyId: data.company_id,
  make: data.make,
  model: data.model,
  year: data.year,
  licensePlate: data.license_plate,
  color: data.color || undefined,
  transmission: data.transmission as 'automatic' | 'manual',
  fuelType: data.fuel_type as 'petrol' | 'diesel' | 'electric' | 'hybrid',
  seats: data.seats,
  dailyRate: Number(data.daily_rate),
  status: data.status as 'active' | 'maintenance' | 'retired',
  imageUrl: data.image_url || undefined,
  features: data.features || undefined,
  depositRequired: data.deposit_required ? Number(data.deposit_required) : undefined,
  pickupLocations: fetchedPickupIds.length > 0 ? fetchedPickupIds : undefined,
  dropoffLocations: fetchedDropoffIds.length > 0 ? fetchedDropoffIds : undefined,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
}

console.log('[updateCarAction] Transformed car before return:', {
  hasPickupLocations: !!transformedCar.pickupLocations,
  pickupLocations: transformedCar.pickupLocations,
  hasDropoffLocations: !!transformedCar.dropoffLocations,
  dropoffLocations: transformedCar.dropoffLocations,
})
```

## Summary

**Key Changes**:
1. ✅ Remove TEXT[] array handling from `carUpdateData`
2. ✅ Use `validateAndFilterLocationIds()` for validation
3. ✅ Use `updateCarLocationsJunction()` to save locations
4. ✅ Use `fetchCarLocationIds()` to retrieve locations
5. ✅ Verify locations match after save
6. ✅ Return locations from junction table, not TEXT[] columns

**Helper Functions Already Added** (no changes needed):
- `validateAndFilterLocationIds()` - Line ~40
- `updateCarLocationsJunction()` - Line ~90
- `fetchCarLocationIds()` - Line ~150

