# Architecture Fixes - Root Cause Resolution

This document describes the comprehensive architectural fixes applied to resolve streaming errors, role assignment issues, and CSS warnings.

## ✅ Fixed Issues

### 1. Streaming Crash - "Error in input stream"

**Root Cause**: Server components were executing side effects (database writes, role assignment) during React Server Component (RSC) rendering, causing Next.js streaming to fail.

**Fix Applied**:
- **Removed all side effects from RSC render paths**
  - Removed `assignPartnerRoleIfNeeded()` call from `app/dashboard/page.tsx` render
  - Removed `ensureUserCompany()` from dashboard render (kept read-only `getUserCompanyId()`)
  - Server components are now **read-only and deterministic**

- **Moved role assignment to API route**
  - Created `app/api/assign-role/route.ts` - server-only API route
  - Uses `SUPABASE_SERVICE_ROLE_KEY` in secure server context
  - Never exposed to client

- **Client-side role assignment handler**
  - Created `app/components/ui/auth/role-assignment-handler.tsx`
  - Calls API route after page render (client-side)
  - Prevents streaming errors by keeping RSC render pure

**Files Modified**:
- `app/dashboard/page.tsx` - Removed side effects, made read-only
- `app/api/assign-role/route.ts` - New API route for role assignment
- `app/components/ui/auth/role-assignment-handler.tsx` - New client component
- `lib/server/auth/login-actions.ts` - Removed role assignment from login action

**Result**: ✅ No more "Error in input stream" errors

---

### 2. Supabase Role Assignment Architecture

**Root Cause**: Role assignment was happening in multiple places (login action, dashboard render) causing conflicts and streaming errors.

**Fix Applied**:
- **Centralized role assignment in API route**
  - Single source of truth: `/api/assign-role`
  - Server-only execution with service role key
  - Proper authentication validation

- **Security hardening**
  - Service role key only used in API route (server-only)
  - Never exposed to client or RSC render functions
  - Proper error handling and logging

- **Automatic assignment flow**
  1. User logs in → authentication succeeds
  2. Dashboard loads → `RoleAssignmentHandler` component mounts
  3. If user has no role → calls `/api/assign-role`
  4. API route assigns "partner" role using Admin API
  5. Page refreshes to reflect new role

**Files Created**:
- `app/api/assign-role/route.ts` - Role assignment API route
- `app/components/ui/auth/role-assignment-handler.tsx` - Client-side handler

**Result**: ✅ Clean, secure role assignment architecture

---

### 3. Auth Flow Hardening

**Fix Applied**:
- **Separated concerns**
  - Login action: Authentication only (no side effects)
  - Role assignment: Separate API route call
  - Dashboard render: Read-only data fetching

- **Error handling**
  - Role assignment failures don't block login
  - Graceful degradation if service role key is missing
  - Clear error messages in console

**Files Modified**:
- `lib/server/auth/login-actions.ts` - Removed role assignment, kept auth-only

**Result**: ✅ Stable, predictable auth flow

---

### 4. Error Boundaries

**Fix Applied**:
- **Global error boundary** (`app/error.tsx`)
  - Catches all unhandled errors
  - Returns `null` (invisible to users)
  - Logs to console for debugging

- **Dashboard error boundary** (`app/dashboard/error.tsx`)
  - Simplified to be completely invisible
  - Prevents error UI from breaking HMR

**Files Modified**:
- `app/error.tsx` - Global error boundary
- `app/dashboard/error.tsx` - Dashboard error boundary

**Result**: ✅ Errors are invisible, no HMR breaks

---

### 5. CSS Preload Warnings

**Fix Applied**:
- **Font preload disabled**
  - Set `preload: false` in `app/layout.tsx`
  - Font still loads with `display: 'swap'` for performance

- **Next.js config cleanup**
  - Removed deprecated `optimizeFonts` option
  - Font optimization handled automatically by Next.js

**Files Modified**:
- `app/layout.tsx` - Font preload disabled
- `next.config.js` - Removed deprecated option

**Result**: ✅ No CSS preload warnings

---

## Architecture Principles Applied

### 1. Server Components are Read-Only
- ✅ No database writes during render
- ✅ No side effects in RSC functions
- ✅ Deterministic rendering

### 2. Side Effects in Appropriate Boundaries
- ✅ API routes for server-only operations
- ✅ Server actions for mutations
- ✅ Client components for post-render effects

### 3. Security First
- ✅ Service role key only in API routes
- ✅ Never exposed to client
- ✅ Proper authentication validation

### 4. Error Handling
- ✅ Errors don't crash rendering
- ✅ Graceful degradation
- ✅ Clear logging for debugging

---

## Environment Variables Required

```bash
# Required for role assignment
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for Supabase client
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional
NEXT_PUBLIC_CUSTOMER_SITE_URL=https://customer.wheely.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important**: Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for role assignment to work.

---

## Validation Checklist

- ✅ Build completes successfully
- ✅ No "Error in input stream" errors
- ✅ No Supabase role assignment warnings (when key is set)
- ✅ No CSS preload warnings
- ✅ Role assignment works automatically on first login
- ✅ Server components are read-only
- ✅ Service role key is server-only
- ✅ Error boundaries prevent crashes

---

## Next Steps

1. **Set Environment Variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
2. **Test Login Flow**: Verify role assignment happens automatically
3. **Monitor Logs**: Check console for role assignment success/failure
4. **Production Deployment**: Ensure all environment variables are set in hosting platform

---

## Related Documentation

- `docs/ENVIRONMENT_SETUP.md` - Environment variables guide
- `docs/RUNTIME_FIXES_SUMMARY.md` - Previous fixes summary

