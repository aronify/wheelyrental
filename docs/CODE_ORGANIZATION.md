# Code Organization Guide

## Project Structure

### `/app` - Next.js App Router
- **Pages**: Route handlers and page components
- **Components**: Reusable UI components organized by domain
- **Auth**: Authentication pages grouped under `/app/auth/`

### `/lib` - Shared Libraries
- **`/lib/server`**: Server-side code (actions, helpers)
  - `/auth`: Authentication actions
  - `/data`: Data access layer (Supabase queries)
- **`/lib/utils`**: Utility functions (timeout, helpers)
- **`/lib/i18n`**: Internationalization
- **`/lib/supabase`**: Supabase client configuration

### `/database` - Database Scripts
- **`/migrations`**: Schema migrations (run in order)
- **`/rls-policies`**: Row Level Security policies
- **`/utilities`**: Business logic utilities (constraints, triggers)
- **`/samples`**: Sample/test data
- **`/debug`**: Debugging scripts (not for production)

### `/types` - TypeScript Definitions
- Type definitions for all domain models
- Shared interfaces and types

### `/docs` - Documentation
- Active documentation in root
- Historical docs in `/archive`

## Code Patterns

### Server Actions Pattern

```typescript
'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { withSupabaseTimeout, TIMEOUTS } from '@/lib/utils/timeout'

export async function myAction() {
  const supabase = await createServerActionClient()
  
  const { data, error } = await withSupabaseTimeout(
    supabase.from('table').select('*'),
    TIMEOUTS.QUERY
  )
  
  if (error) {
    return { error: error.message }
  }
  
  return { data }
}
```

### Component Organization

- **Domain Components** (`/app/components/domain/`): Feature-specific components
- **UI Components** (`/app/components/ui/`): Reusable, generic components

### Import Patterns

```typescript
// Types
import { Car, CarFormData } from '@/types/car'

// Server utilities
import { withSupabaseTimeout, TIMEOUTS } from '@/lib/utils/timeout'
import { getUserCompanyId } from '@/lib/server/data/company-helpers'

// UI components
import { useLanguage } from '@/lib/i18n/language-context'
```

## Best Practices

1. **Always use typed helpers** for Supabase queries (`withSupabaseTimeout`)
2. **Group related files** in domain folders
3. **Use server actions** for data mutations
4. **Handle errors** with proper error messages
5. **Use timeouts** for all async operations
6. **Type everything** - avoid `any` when possible

## File Naming

- **Components**: `kebab-case.tsx` (e.g., `car-form-modal.tsx`)
- **Actions**: `kebab-case-actions.ts` (e.g., `cars-data-actions.ts`)
- **Types**: `singular.ts` (e.g., `car.ts`, `booking.ts`)
- **SQL Scripts**: `descriptive-name.sql` (e.g., `fix-locations-rls.sql`)

## Avoiding Common Errors

1. **TypeScript Timeout Errors**: Always use `withSupabaseTimeout` for Supabase queries
2. **Import Errors**: Use absolute imports with `@/` prefix
3. **RLS Errors**: Ensure company_id is set correctly in queries
4. **Type Errors**: Define proper interfaces in `/types` folder


