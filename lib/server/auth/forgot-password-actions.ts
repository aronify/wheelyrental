'use server'

import { createServerComponentClient } from '@/lib/supabase/client'

export interface ForgotPasswordResult {
  error?: string
  success?: boolean
  message?: string
}

/**
 * Server action to handle password reset request
 * 
 * Sends a password reset email to the user via Supabase
 */
export async function forgotPasswordAction(
  email: string
): Promise<ForgotPasswordResult> {
  try {
    if (!email || !email.includes('@')) {
      return {
        error: 'Please enter a valid email address.',
      }
    }

    const supabase = await createServerComponentClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
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

      // Don't reveal if email exists or not for security (for other errors)
      return {
        error: 'If an account exists with this email, you will receive a password reset link.',
        success: false,
      }
    }

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    }
  } catch (error: unknown) {
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

