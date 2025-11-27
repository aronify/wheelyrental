# Supabase Setup Guide

This guide will walk you through setting up Supabase for the RentHub Owner Portal.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com) if you don't have one)
- Node.js and npm installed on your machine

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create a new account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: e.g., "RentHub Owner Portal"
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Choose "Free" for development
5. Click **"Create new project"**
6. Wait for the project to be set up (this takes 1-2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   https://jzgshexcdhvhupqasmvz.supabase.co
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z3NoZXhjZGh2aHVwcWFzbXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTA5OTksImV4cCI6MjA3OTQ4Njk5OX0.IbxzbUvIudqCUCFrfzUB-3pMeSQbHNv7agDyYxG0R1U
   - **anon public** key (a long string starting with `eyJ...`)

## Step 3: Configure Authentication

1. In the Supabase dashboard, go to **Authentication** in the left sidebar
2. Click on **Providers**
3. Make sure **Email** is enabled (it should be by default)
4. Under **Email** settings:
   - **Enable Email provider**: Should be ON
   - **Confirm email**: You can disable this for development, or keep it enabled for production
   - **Secure email change**: Recommended to keep ON

### Configure Redirect URLs (Important for Password Reset!)

1. Still in the **Authentication** section, click on **URL Configuration** in the left sidebar
2. Under **Redirect URLs**, add the following URLs:
   - For development: `http://localhost:3000/reset-password`
   - For production: `https://yourdomain.com/reset-password` (replace with your actual domain)
3. Click **Save** to apply the changes

**Note**: Without configuring these redirect URLs, the password reset link from your email will not work!

## Step 4: Set Up Environment Variables

1. In your project root directory, create a file named `.env.local`
2. Add the following content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Replace:
   - `https://xxxxxxxxxxxxx.supabase.co` with your **Project URL**
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your **anon public** key
   - `http://localhost:3000` with your production URL when deploying

## Step 5: Create Your First Test User

### Option A: Via Supabase Dashboard

1. Go to **Authentication** > **Users** in the Supabase dashboard
2. Click **"Add user"** > **"Create new user"**
3. Enter:
   - **Email**: e.g., `owner@test.com`
   - **Password**: Choose a secure password
4. Click **"Create user"**

### Option B: Via the Login Page

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Use the "Sign up" flow (if you add one) or create users via the dashboard

## Step 6: Verify the Setup

1. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and go to `http://localhost:3000/login`

4. Try logging in with the test user you created

5. If successful, you should be redirected to `/dashboard`

## Troubleshooting

### "Invalid API key" error
- Double-check that your `.env.local` file has the correct values
- Make sure there are no extra spaces or quotes around the values
- Restart your development server after changing `.env.local`

### "Email not confirmed" error
- Go to Supabase Dashboard > Authentication > Users
- Find your user and click on them
- Click **"Confirm email"** button

### Session not persisting
- Make sure `middleware.ts` is in your project root
- Check that cookies are enabled in your browser
- Verify the middleware is running (check Next.js console output)

### Can't find environment variables
- Make sure `.env.local` is in the project root (same level as `package.json`)
- Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- Restart the dev server after adding/changing environment variables

### Password reset link doesn't work
- Make sure you've added the redirect URL in Supabase Dashboard > Authentication > URL Configuration
- Add `http://localhost:3000/reset-password` for development
- Check that `NEXT_PUBLIC_SITE_URL` is set in your `.env.local` file
- The reset link expires after 1 hour - request a new one if expired
- Check your spam folder if you don't receive the email

## Next Steps

### For Production

1. **Enable Row Level Security (RLS)**: 
   - Go to **Authentication** > **Policies** in Supabase
   - Set up policies to secure your data

2. **Add Role-Based Access Control**:
   - In the login action (`app/login/actions.ts`), add checks to verify users have the "owner" role
   - You can use Supabase's user metadata or a separate `user_roles` table

3. **Set up Email Templates**:
   - Go to **Authentication** > **Email Templates**
   - Customize the email templates for your brand

4. **Configure Password Reset**:
   - The "Forgot password?" link is already in the UI
   - Implement the reset flow using Supabase's password reset functionality

### Security Best Practices

- Never commit `.env.local` to version control (it should be in `.gitignore`)
- Use the `anon` key for client-side operations (it's safe to expose)
- Use the `service_role` key only in secure server environments (never expose it)
- Enable RLS on all your database tables
- Regularly rotate your API keys in production

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth Helpers](https://github.com/supabase/auth-helpers)

## Support

If you encounter issues:
1. Check the Supabase dashboard logs: **Logs** > **API Logs**
2. Check your browser console for client-side errors
3. Check your terminal for server-side errors
4. Review the Supabase documentation linked above

