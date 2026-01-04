# TypeScript Timeout Fixes - December 2024

## Problem

TypeScript compilation errors occurred when using `withTimeout()` directly with Supabase query builders. The error was:
```
Type error: Property 'data' does not exist on type 'unknown'.
```

## Root Cause

Supabase query builders are **thenable** (have `.then()` method) but are **not typed as Promises** in TypeScript. When passed to `withTimeout()`, TypeScript cannot infer the return type, resulting in `unknown`.

## Solution Implemented

### 1. Created `withSupabaseTimeout()` Helper

Added a new helper function in `lib/utils/timeout.ts` that:
- Properly types Supabase query results as `SupabaseQueryResult<T>`
- Handles both Promise and thenable query builders
- Returns correctly typed results

```typescript
export function withSupabaseTimeout<T = any>(
  query: any, // Accept any thenable (Supabase query builders)
  timeoutMs: number,
  errorMessage?: string
): Promise<SupabaseQueryResult<T>>
```

### 2. Updated All Supabase Queries

Replaced all `withTimeout()` calls for Supabase queries with `withSupabaseTimeout()`:

**Files Updated:**
- `lib/server/data/cars-data-actions.ts` - 15 instances fixed
- `lib/server/data/profile-data-actions.ts` - 6 instances fixed

**Pattern Changed:**
```typescript
// Before (caused errors)
const { data, error } = await withTimeout(
  supabase.from('locations').select('*'),
  TIMEOUTS.QUERY
)

// After (correctly typed)
const { data, error } = await withSupabaseTimeout(
  supabase.from('locations').select('*'),
  TIMEOUTS.QUERY
)
```

### 3. Kept `withTimeout()` for Regular Promises

`withTimeout()` is still used for:
- `supabase.auth.getUser()` - Returns a Promise
- `getUserCompanyId()` - Returns a Promise
- Other regular Promise operations

## Files Modified

1. **`lib/utils/timeout.ts`**
   - Added `SupabaseQueryResult<T>` type
   - Added `withSupabaseTimeout()` function

2. **`lib/server/data/cars-data-actions.ts`**
   - Updated all Supabase queries to use `withSupabaseTimeout`
   - Fixed type annotation for location mapping

3. **`lib/server/data/profile-data-actions.ts`**
   - Updated all Supabase queries to use `withSupabaseTimeout`

## Prevention

Created documentation to prevent future errors:
- `docs/TYPESCRIPT_TIMEOUT_PATTERNS.md` - Usage patterns and best practices
- `docs/CODE_ORGANIZATION.md` - Code organization guide

## Verification

✅ Build passes: `npm run build` completes successfully
✅ No TypeScript errors
✅ All Supabase queries properly typed
✅ Timeout functionality preserved

## Usage Guidelines

**For Supabase Queries:**
```typescript
import { withSupabaseTimeout, TIMEOUTS } from '@/lib/utils/timeout'

const { data, error } = await withSupabaseTimeout(
  supabase.from('table').select('*'),
  TIMEOUTS.QUERY
)
```

**For Regular Promises:**
```typescript
import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout'

const result = await withTimeout(
  somePromiseFunction(),
  TIMEOUTS.QUERY
)
```




