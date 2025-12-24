# TypeScript Timeout Patterns - Best Practices

## Problem

Supabase query builders are **thenable** (they have a `.then()` method) but are **not typed as Promises** in TypeScript. When using `withTimeout()` directly with Supabase queries, TypeScript cannot infer the return type, resulting in `unknown` type errors.

## Solution

Use `withSupabaseTimeout()` helper function for all Supabase queries. This function:
1. Properly types Supabase query results
2. Handles both Promise and thenable query builders
3. Returns a properly typed `SupabaseQueryResult<T>`

## Usage Patterns

### ✅ CORRECT: Use `withSupabaseTimeout` for Supabase queries

```typescript
import { withSupabaseTimeout, TIMEOUTS } from '@/lib/utils/timeout'

// For queries that return data
const { data, error, count } = await withSupabaseTimeout(
  supabase
    .from('locations')
    .select('id, name, city')
    .eq('is_active', true),
  TIMEOUTS.QUERY,
  'Failed to fetch locations'
)

// For queries with specific return types
const result = await withSupabaseTimeout<LocationType[]>(
  supabase.from('locations').select('*'),
  TIMEOUTS.QUERY
)
const { data, error } = result
```

### ❌ INCORRECT: Using `withTimeout` directly with Supabase queries

```typescript
// This will cause TypeScript errors
const { data, error } = await withTimeout(
  supabase.from('locations').select('*'),
  TIMEOUTS.QUERY
)
// Error: Property 'data' does not exist on type 'unknown'
```

### ✅ CORRECT: Use `withTimeout` for regular Promises

```typescript
import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout'

// For regular Promises (not Supabase queries)
const companyId = await withTimeout(
  getUserCompanyId(user.id),
  TIMEOUTS.QUERY,
  'Failed to retrieve company information'
)

// For auth operations
const { data: { user } } = await withTimeout(
  supabase.auth.getUser(),
  TIMEOUTS.AUTH_CHECK
)
```

## Type Definitions

```typescript
type SupabaseQueryResult<T = any> = {
  data: T | null
  error: any
  count?: number | null
}
```

## When to Use Which

| Operation | Use |
|-----------|-----|
| Supabase `.from().select()` queries | `withSupabaseTimeout` |
| Supabase `.from().insert()` queries | `withSupabaseTimeout` |
| Supabase `.from().update()` queries | `withSupabaseTimeout` |
| Supabase `.from().delete()` queries | `withSupabaseTimeout` |
| `supabase.auth.getUser()` | `withTimeout` (returns Promise) |
| `getUserCompanyId()` helper | `withTimeout` (returns Promise) |
| Any regular Promise | `withTimeout` |

## Common Patterns

### Pattern 1: Query with count

```typescript
const { data, error, count } = await withSupabaseTimeout(
  supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('is_active', true),
  TIMEOUTS.QUERY
)
```

### Pattern 2: Single result query

```typescript
const { data: location, error } = await withSupabaseTimeout(
  supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single(),
  TIMEOUTS.QUERY
)
```

### Pattern 3: Insert with return

```typescript
const { data: newLocation, error } = await withSupabaseTimeout(
  supabase
    .from('locations')
    .insert(locationData)
    .select('id, name')
    .single(),
  TIMEOUTS.INSERT
)
```

### Pattern 4: Update query

```typescript
const { data, error } = await withSupabaseTimeout(
  supabase
    .from('locations')
    .update(updateData)
    .eq('id', locationId)
    .select('*')
    .single(),
  TIMEOUTS.UPDATE
)
```

### Pattern 5: Delete query

```typescript
const { error } = await withSupabaseTimeout(
  supabase
    .from('locations')
    .delete()
    .eq('id', locationId),
  TIMEOUTS.DELETE
)
```

## Error Handling

Always check for errors after using timeout helpers:

```typescript
const { data, error } = await withSupabaseTimeout(
  supabase.from('locations').select('*'),
  TIMEOUTS.QUERY
)

if (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout
    return { error: 'Request timed out' }
  }
  // Handle other errors
  return { error: error.message }
}
```

## Prevention Checklist

When adding new database queries:

- [ ] Use `withSupabaseTimeout` for all Supabase `.from()` queries
- [ ] Use `withTimeout` for regular Promises (auth, helpers)
- [ ] Always destructure `{ data, error }` from result
- [ ] Handle `TimeoutError` in catch blocks
- [ ] Use appropriate `TIMEOUTS` constant
- [ ] Add type parameter `<T>` if you need specific typing

## Files Using Timeout Helpers

- `lib/server/data/cars-data-actions.ts` - All Supabase queries use `withSupabaseTimeout`
- `lib/server/data/profile-data-actions.ts` - All Supabase queries use `withSupabaseTimeout`
- `lib/server/auth/login-actions.ts` - Uses `withTimeout` for auth operations


