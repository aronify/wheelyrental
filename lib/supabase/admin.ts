/**
 * Supabase Admin Client
 * 
 * Server-only utility for creating Supabase admin client with service role key.
 * This client has admin privileges and must NEVER be exposed to the client.
 * 
 * SECURITY:
 * - Server-only execution
 * - Uses SUPABASE_SERVICE_ROLE_KEY (never exposed to client)
 * - Validates environment variables lazily (only when function is called)
 * 
 * NOTE: Validation is lazy to allow builds to complete without env vars.
 * The env vars are only needed at runtime when the API route is called.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client with service role key.
 * This client has admin privileges and can perform operations like:
 * - Updating user metadata (app_metadata)
 * - Managing user roles
 * - Bypassing RLS policies
 * 
 * @returns Supabase admin client
 * @throws Error if required environment variables are missing
 */
export function createAdminClient() {
  // Validate environment variables lazily (only when function is called)
  // This allows builds to complete without env vars (they're only needed at runtime)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please set this in your environment variables. ' +
      'For local development: add to .env.local. ' +
      'For Vercel: add in Project Settings > Environment Variables.'
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'This is required for admin operations like role assignment. ' +
      'Please set this in your environment variables. ' +
      'For local development: add to .env.local. ' +
      'For Vercel: add in Project Settings > Environment Variables. ' +
      'Get it from: https://app.supabase.com/project/_/settings/api'
    )
  }

  // TypeScript type narrowing: after validation checks, these are guaranteed to be strings
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

