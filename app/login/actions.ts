'use server'

import { createServerComponentClient } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface LoginFormData {
  email: string
  password: string
}

export interface LoginActionResult {
  error?: string
  success?: boolean
}

/**
 * Server action to handle user login
 * 
 * TODO: Add role-based checks here to ensure only "owners" can log in
 * Example: Check user metadata or a user_roles table after successful login
 */
export async function loginAction(
  formData: LoginFormData
): Promise<LoginActionResult> {
  try {
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
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

      // Check for invalid credentials
      if (
        errorMessage.includes('invalid') ||
        errorMessage.includes('credentials') ||
        errorMessage.includes('email') ||
        errorMessage.includes('password') ||
        error.code === 'invalid_credentials'
      ) {
        return {
          error: 'Invalid email or password. Please check your credentials and try again.',
        }
      }

      // Generic error fallback
      return {
        error: error.message || 'Failed to sign in. Please check your credentials.',
      }
    }

    if (!data.session) {
      return {
        error: 'No session created. Please try again.',
      }
    }

    // Revalidate the path to ensure fresh data
    revalidatePath('/dashboard')
    
    // Redirect will be handled by the client component
    return { success: true }
  } catch (error: unknown) {
    console.error('Login error:', error)
    
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

