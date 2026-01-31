'use server'

import { createServerActionClient } from '@/lib/supabase/client'

/**
 * Server action to handle user logout
 *
 * Note: redirect() cannot be used in server actions.
 * The client should handle the redirect after this action succeeds.
 */
export async function logoutAction() {
  try {
    const supabase = await createServerActionClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        error: 'Failed to logout. Please try again.',
      }
    }

    return {
      success: true,
    }
  } catch (error: unknown) {
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
