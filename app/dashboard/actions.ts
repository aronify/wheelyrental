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
      console.error('Logout error:', error)
      return {
        error: 'Failed to logout. Please try again.',
      }
    }
    
    // Redirect to login page
    redirect('/login')
  } catch (error: unknown) {
    console.error('Logout error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}


