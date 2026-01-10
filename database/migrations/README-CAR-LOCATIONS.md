# Car Locations Junction Table Migration

## Overview

This migration creates a proper junction table (`car_locations`) that establishes a many-to-many relationship between cars and locations, enabling:

- **Multiple pickup locations** per car
- **Multiple dropoff locations** per car
- **Efficient location-based car queries** for booking flows
- **Referential integrity** with foreign key constraints
- **Performance optimization** with strategic indexes

## Schema Design

### Table Structure

```sql
car_locations
├── id (UUID, Primary Key)
├── car_id (UUID, Foreign Key → cars.id)
├── location_id (UUID, Foreign Key → locations.id)
├── location_type (TEXT, CHECK: 'pickup' | 'dropoff')
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Key Features

1. **Unique Constraint**: Prevents duplicate car-location-type combinations
   - A car can have the same location for both pickup AND dropoff (two separate rows)
   - A car cannot have duplicate pickup entries for the same location

2. **Cascade Deletes**: 
   - Deleting a car removes all its location associations
   - Deleting a location removes all car associations to that location

3. **Type Safety**: 
   - `location_type` is constrained to 'pickup' or 'dropoff'
   - Enables clear separation of pickup vs dropoff availability

## Migration Files

1. **migration-create-car-locations-junction.sql**
   - Creates the `car_locations` table
   - Sets up indexes for performance
   - Adds triggers for `updated_at` maintenance
   - Enables Row Level Security (RLS)

2. **migration-car-locations-query-examples.sql**
   - Example queries for common use cases
   - Performance optimization notes
   - Supabase PostgREST query examples

## Installation

### Step 1: Run the Migration

Execute the migration in your Supabase SQL Editor:

```sql
-- Run this file:
database/migrations/migration-create-car-locations-junction.sql
```

### Step 2: Verify Installation

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'car_locations';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'car_locations' 
  AND schemaname = 'public';

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.car_locations'::regclass;
```

### Step 3: RLS Policies

The RLS policies are already configured in:
- `database/rls-policies/rls-security-policies.sql`

These policies ensure:
- Users can only access `car_locations` for cars from their company
- All operations (SELECT, INSERT, UPDATE, DELETE) are company-scoped

## Usage Examples

### Adding Locations to a Car

```typescript
// Add pickup location
await supabase
  .from('car_locations')
  .insert({
    car_id: carId,
    location_id: locationId,
    location_type: 'pickup'
  })

// Add dropoff location
await supabase
  .from('car_locations')
  .insert({
    car_id: carId,
    location_id: locationId,
    location_type: 'dropoff'
  })
```

### Querying Cars by Location

```typescript
// Find cars available for pickup at a location
const { data } = await supabase
  .from('cars')
  .select(`
    *,
    car_locations!inner(
      location_type,
      location:locations!inner(
        id,
        name,
        city
      )
    )
  `)
  .eq('car_locations.location_id', locationId)
  .eq('car_locations.location_type', 'pickup')
  .eq('status', 'active')
```

See `migration-car-locations-query-examples.sql` for more examples.

## Compatibility

### Existing Records

- ✅ **Safe for existing databases**: Uses `IF NOT EXISTS` clauses
- ✅ **No data loss**: Does not modify existing car records
- ✅ **Backward compatible**: Existing code continues to work

### Integration Points

The schema integrates with:

1. **Cars Table**: Foreign key relationship ensures referential integrity
2. **Locations Table**: Foreign key relationship links to company locations
3. **RLS Policies**: Company-scoped access control via `user_has_company_access()`
4. **Application Code**: Already compatible with `cars-data-actions.ts`

## Performance Considerations

### Indexes Created

1. **idx_car_locations_car_id**: Fast lookups of all locations for a car
2. **idx_car_locations_location_id**: Fast lookups of all cars at a location
3. **idx_car_locations_location_type**: Optimizes location_type filtering
4. **idx_car_locations_car_type**: Optimizes car + location_type queries

### Query Optimization Tips

1. Always filter by `location_type` when possible
2. Use `status = 'active'` filter on cars table
3. Use `is_active = true` filter on locations table
4. Consider composite indexes for specific query patterns

## Troubleshooting

### Error: "relation car_locations does not exist"

**Solution**: Run the migration file `migration-create-car-locations-junction.sql`

### Error: "foreign key constraint violation"

**Solution**: Ensure:
- The `car_id` exists in the `cars` table
- The `location_id` exists in the `locations` table
- Both records belong to the same company (for RLS)

### Error: "duplicate key value violates unique constraint"

**Solution**: The unique constraint prevents duplicate car-location-type combinations. If you need both pickup and dropoff at the same location, create two separate rows with different `location_type` values.

## Next Steps

1. ✅ Run the migration
2. ✅ Verify table creation
3. ✅ Test with sample data
4. ✅ Update application code to use the junction table (already compatible)
5. ✅ Test location-based car queries

## Related Files

- `database/migrations/migration-create-car-locations-junction.sql` - Main migration
- `database/migrations/migration-car-locations-query-examples.sql` - Query examples
- `database/rls-policies/rls-security-policies.sql` - RLS policies
- `lib/server/data/cars-data-actions.ts` - Application code using the table


