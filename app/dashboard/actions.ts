'use server'

import { createServerComponentClient } from '@/lib/supabaseClient'
import { redirect } from 'next/navigation'

/**
 * Server action to handle user logout
 */
export async function logoutAction() {
  try {
    const supabase = await createServerComponentClient()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        error: 'Failed to logout. Please try again.',
      }
    }
    
    // Redirect to login page
    redirect('/login')
  } catch (error: unknown) {
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}


