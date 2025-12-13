/**
 * Supabase Client Configuration
 * 
 * This file sets up the Supabase client for use in Next.js 14 App Router.
 * 
 * Required environment variables (add to .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
 * 
 * To get these values:
 * 1. Go to your Supabase project dashboard
 * 2. Navigate to Settings > API
 * 3. Copy the "Project URL" and "anon public" key
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// For client components (browser)
export function createClientComponentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    )
  }

  try {
    const client = createBrowserClient(url, key)
    return client
  } catch (err: any) {
    throw err
  }
}

// For server components
export async function createServerComponentClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const error = new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file. ' +
      'Get them from: https://supabase.com/dashboard/project/_/settings/api'
    )
    console.error('[SupabaseClient] Missing environment variables:', {
      hasUrl: !!url,
      hasKey: !!key,
    })
    throw error
  }

  try {
    const cookieStore = await cookies()

    return createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (err: any) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn('[SupabaseClient] Cookie setAll warning (expected in some cases):', {
                message: err?.message,
              })
            }
          },
        },
      }
    )
  } catch (err: any) {
    console.error('[SupabaseClient] Error creating server client:', {
      message: err?.message,
      stack: err?.stack,
    })
    throw err
  }
}

// For server actions (same implementation but different name for clarity)
export async function createServerActionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const error = new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    )
    console.error('[SupabaseClient] Missing environment variables in server action:', {
      hasUrl: !!url,
      hasKey: !!key,
    })
    throw error
  }

  try {
    const cookieStore = await cookies()

    return createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (err: any) {
              // The `setAll` method was called from a Server Action.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn('[SupabaseClient] Cookie setAll warning in server action (expected in some cases):', {
                message: err?.message,
              })
            }
          },
        },
      }
    )
  } catch (err: any) {
    console.error('[SupabaseClient] Error creating server action client:', {
      message: err?.message,
      stack: err?.stack,
    })
    throw err
  }
}

