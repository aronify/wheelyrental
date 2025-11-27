# Reset Password Link Fix Guide

## The Problem
The reset password link from your email doesn't work because the redirect URL needs to be configured in your Supabase dashboard.

## Solution: Configure Supabase Redirect URLs

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project: **jzgshexcdhvhupqasmvz**

### Step 2: Configure Redirect URLs
1. Click **Authentication** in the left sidebar
2. Click **URL Configuration**
3. Under **Redirect URLs**, add these URLs:

   **For Development:**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```

   **For Production (when you deploy):**
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/**
   ```

4. Click **Save**

### Step 3: Configure Site URL
1. Still in **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Click **Save**

### Step 4: Test the Flow
1. Go to http://localhost:3000/forgot-password
2. Enter your email
3. Check your email for the reset link
4. Click the link - it should now work!

## Additional Settings (Optional but Recommended)

### Email Template Customization
1. Go to **Authentication** > **Email Templates**
2. Select **Reset Password**
3. Customize the email template if needed
4. The default template works fine

### Password Requirements
1. Go to **Authentication** > **Policies**
2. Review password requirements
3. Default minimum is 6 characters

## Troubleshooting

### Link Still Doesn't Work?

**Check 1: Verify Redirect URL**
- Make sure `http://localhost:3000/auth/callback` is in the allowed list
- Include the wildcard: `http://localhost:3000/**`

**Check 2: Check Email Link**
- The link should look like: `http://localhost:3000/auth/callback?code=...`
- If it shows a different domain, update Site URL in Supabase

**Check 3: Clear Browser Cache**
- Clear cookies and cache
- Try in incognito/private mode

**Check 4: Check Token Expiry**
- Reset password tokens expire after 1 hour
- Request a new reset email if expired

**Check 5: Restart Dev Server**
After changing .env.local:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Common Errors

**"Invalid or expired token"**
- Token has expired (request new one)
- Link was already used
- Request a fresh reset email

**"Redirect URL not allowed"**
- Not configured in Supabase dashboard
- Follow Step 2 above

**"Failed to fetch"**
- Check internet connection
- Verify Supabase URL in .env.local
- Check if Supabase project is active

## Current Configuration

Your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://jzgshexcdhvhupqasmvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

This is correct! ✓

## What Happens After Configuration

1. **User requests password reset** → Email sent
2. **User clicks email link** → Redirected to `/reset-password`
3. **Supabase validates token** → Creates temporary session
4. **User enters new password** → Password updated
5. **User logged out** → Redirected to login
6. **User logs in with new password** → Success!

## Quick Test Checklist

- [ ] Supabase redirect URLs configured
- [ ] Site URL set correctly
- [ ] .env.local has correct values
- [ ] Dev server restarted
- [ ] Email received
- [ ] Link format correct
- [ ] Page loads at /reset-password
- [ ] Can enter new password
- [ ] Password updates successfully
- [ ] Can login with new password

## Need More Help?

1. Check Supabase dashboard logs:
   - Go to **Logs** > **API Logs**
   - Look for errors related to password reset

2. Check browser console:
   - Open DevTools (F12)
   - Look for error messages

3. Check terminal output:
   - Look for server-side errors
   - Check for authentication errors

## Production Deployment

When deploying to production:

1. Update `.env.local` → `.env.production`:
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

2. Update Supabase redirect URLs:
   ```
   https://yourdomain.com/reset-password
   https://yourdomain.com/**
   ```

3. Update Site URL in Supabase

4. Test the flow on production

---

**After following these steps, your reset password link should work perfectly!**

