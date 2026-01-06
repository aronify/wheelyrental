# Environment Variables Setup

This document describes all required and optional environment variables for the Wheely Partner Dashboard.

## Required Environment Variables

### Supabase Configuration

```bash
# Supabase Project URL
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public)
# Get from: https://app.supabase.com/project/_/settings/api
# This key is safe to expose to the client (it's public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Supabase Service Role Key (Required for Role Assignment)

```bash
# Supabase Service Role Key (PRIVATE - Server Only)
# ⚠️ SECURITY WARNING: This key has admin privileges. NEVER expose it to the client.
# Only use it server-side (in API routes, server actions, middleware).
# Get from: https://app.supabase.com/project/_/settings/api (Service Role Key section)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Why is this required?**
- The service role key is needed to update user metadata (`app_metadata.role`) via the Admin API
- Role assignment happens automatically on first login for new users
- Without this key, users can still login, but role assignment will be skipped (logged as warning)

## Optional Environment Variables

```bash
# Customer Site URL (for redirecting non-partner users)
# Default: https://customer.wheely.com
NEXT_PUBLIC_CUSTOMER_SITE_URL=https://customer.wheely.com

# Site URL (for password reset callbacks)
# Default: http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Setup Instructions

1. Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials from your Supabase project dashboard:
   - Go to: https://app.supabase.com/project/_/settings/api
   - Copy the Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

3. Restart your development server after adding environment variables:

```bash
npm run dev
```

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - It's already in `.gitignore`
   - Use `.env.example` for documentation

2. **Service Role Key Security**
   - Only use `SUPABASE_SERVICE_ROLE_KEY` in server-side code
   - Never expose it in client components, API routes that are public, or browser console
   - Rotate the key if it's ever exposed

3. **Environment Variable Naming**
   - `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys)
   - Variables without `NEXT_PUBLIC_` prefix are server-only (use for secrets)

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY" Warning

If you see this warning in the console:
```
[RoleAssignment] Missing SUPABASE_SERVICE_ROLE_KEY - role assignment skipped. User can still login.
```

**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file. Users can still login, but role assignment won't happen automatically.

### "Missing Supabase environment variables" Error

If you see this error:
```
Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Solution**: Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

## Role Assignment Flow

1. User logs in for the first time
2. System checks `auth.users.raw_app_meta_data.role`
3. If role is `NULL`:
   - System uses `SUPABASE_SERVICE_ROLE_KEY` to call Admin API
   - Updates `app_metadata.role = "partner"` atomically
   - User can now access partner dashboard
4. If role exists and is NOT "partner":
   - User is redirected to customer site
5. If role === "partner":
   - User can access partner dashboard

## Production Deployment

### Vercel Deployment

**CRITICAL: You must set environment variables in Vercel before deployment.**

#### Step-by-Step Vercel Setup:

1. **Go to your Vercel project dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project (wheelyrental)

2. **Navigate to Project Settings:**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add the following environment variables:**

   **Required for all environments (Production, Preview, Development):**
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

   **Optional:**
   ```
   NEXT_PUBLIC_CUSTOMER_SITE_URL=https://customer.wheely.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```

4. **For each variable:**
   - Click **Add New**
   - Enter the variable name (e.g., `SUPABASE_SERVICE_ROLE_KEY`)
   - Enter the variable value
   - **IMPORTANT:** Select which environments to apply to:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **Save**

5. **Redeploy after adding variables:**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a new deployment

#### Where to Get Your Supabase Keys:

1. Go to: https://app.supabase.com/project/_/settings/api
2. **Project URL** → Copy to `NEXT_PUBLIC_SUPABASE_URL`
3. **anon public** key → Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **service_role** key → Copy to `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

#### Verification:

After deployment, check that:
- ✅ Build completes successfully
- ✅ `/api/assign-role` endpoint works (no 500 errors)
- ✅ Users can login and get role assigned automatically

### Other Platforms (Netlify, Railway, etc.)

1. Add all environment variables in your hosting platform's dashboard
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (required for role assignment)
3. Restart/redeploy after adding environment variables

