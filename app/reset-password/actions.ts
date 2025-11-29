'use server'

import { createServerComponentClient } from '@/lib/supabaseClient'
import { redirect } from 'next/navigation'

export interface ResetPasswordResult {
  error?: string
  success?: boolean
  message?: string
}

/**
 * Server action to handle password reset
 * 
 * Updates the user's password using Supabase
 */
export async function resetPasswordAction(
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        error: 'Password must be at least 6 characters long.',
      }
    }

    const supabase = await createServerComponentClient()

    // Check if user has a valid session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return {
        error: 'Your reset link has expired. Please request a new password reset link.',
      }
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      // Check for database connection errors
      const errorMessage = error.message?.toLowerCase() || ''
      
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('failed to fetch') ||
        error.code === 'PGRST301' ||
        error.code === 'PGRST116'
      ) {
        return {
          error: 'Connection couldn\'t be made to database. Please check your internet connection and try again.',
        }
      }

      // Handle specific Supabase errors
      if (errorMessage.includes('same as the old password')) {
        return {
          error: 'New password must be different from your old password.',
        }
      }

      console.error('Password reset error:', error)
      return {
        error: 'Failed to update password. Please try again.',
      }
    }

    // Sign out the user so they can log in with the new password
    await supabase.auth.signOut()

    return {
      success: true,
      message: 'Password updated successfully. Please log in with your new password.',
    }
  } catch (error: unknown) {
    console.error('Password reset error:', error)
    
    // Check for network/database connection errors in catch block
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
    const errorString = String(error).toLowerCase()
    
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('failed to fetch') ||
      errorString.includes('network') ||
      errorString.includes('connection') ||
      errorString.includes('fetch')
    ) {
      return {
        error: 'Connection couldn\'t be made to database. Please check your internet connection and try again.',
      }
    }

    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}


