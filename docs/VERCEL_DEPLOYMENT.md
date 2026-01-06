# Vercel Deployment Guide

## Quick Setup Checklist

### ✅ Required Environment Variables

You **MUST** set these in Vercel before deployment:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Critical for role assignment**

### 📍 Where to Set Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in left sidebar

3. **Add Each Variable:**
   - Click **Add New**
   - Enter variable name
   - Enter variable value
   - **Select environments:** Production ✅, Preview ✅, Development ✅
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment → **Redeploy**
   - Or push a new commit

## 🔑 Getting Your Supabase Keys

1. Go to: https://app.supabase.com/project/_/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep secret!**

## 🚨 Common Issues

### Build Error: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Cause:** Environment variable not set in Vercel

**Solution:**
1. Go to Vercel Project Settings → Environment Variables
2. Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key
3. Select all environments (Production, Preview, Development)
4. Redeploy

### API Route Returns 500 Error

**Cause:** `SUPABASE_SERVICE_ROLE_KEY` missing or incorrect

**Solution:**
1. Verify the key is set correctly in Vercel
2. Check that it's the **service_role** key (not anon key)
3. Ensure it's set for the correct environment
4. Redeploy after changes

## 📝 Environment Variables Reference

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Public anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Service role key (admin) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_CUSTOMER_SITE_URL` | ⚪ Optional | Customer site URL | Your customer portal URL |
| `NEXT_PUBLIC_SITE_URL` | ⚪ Optional | Site URL for callbacks | Your Vercel domain |

## 🔒 Security Notes

- ⚠️ **NEVER** commit `SUPABASE_SERVICE_ROLE_KEY` to git
- ⚠️ **NEVER** expose service role key to client-side code
- ✅ Service role key is only used in server-side API routes
- ✅ The key is validated lazily (only when API route is called)

## ✅ Verification After Deployment

1. **Check build logs:** Should complete without errors
2. **Test login:** Users should be able to login
3. **Test role assignment:** New users should get "partner" role automatically
4. **Check API route:** `/api/assign-role` should return 200 (not 500)

## 🆘 Still Having Issues?

1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure variables are set for the correct environment (Production/Preview/Development)
4. Try redeploying after setting variables

