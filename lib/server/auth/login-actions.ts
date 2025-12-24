'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { withTimeout, TIMEOUTS, TimeoutError } from '@/lib/utils/timeout'

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
 */
export async function loginAction(
  formData: LoginFormData
): Promise<LoginActionResult> {
  try {
    const supabase = await createServerActionClient()

    // Wrap auth operation with timeout
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      }),
      TIMEOUTS.LOGIN,
      'Login request timed out. Please check your internet connection and try again.'
    )

    if (error) {
      // Log the actual error for debugging
      console.error('Login error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        name: error.name,
      })

      // Check for invalid credentials - be more specific
      if (
        error.message === 'Invalid login credentials' ||
        error.code === 'invalid_credentials'
      ) {
        return {
          error: 'Invalid email or password. Please check your credentials and try again.',
        }
      }

      // Check for email not confirmed
      if (error.message?.includes('Email not confirmed')) {
        return {
          error: 'Please confirm your email address before logging in. Check your inbox for a confirmation link.',
        }
      }

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

      // Generic error fallback - show actual message for debugging
      return {
        error: `Login failed: ${error.message}`,
      }
    }

    if (!data.session) {
      return {
        error: 'No session created. Please try again.',
      }
    }

    // Revalidate the path to ensure fresh data
    revalidatePath('/dashboard')
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:88',message:'loginAction success return',data:{hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Redirect will be handled by the client component
    return { success: true }
  } catch (error: unknown) {
    // Log the full error to console for debugging
    console.error('Login action error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:100',message:'loginAction catch block',data:{error:error instanceof Error ? error.message : String(error),errorName:error instanceof Error ? error.name : 'unknown',hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Handle timeout errors specifically
    if (error instanceof TimeoutError) {
      return {
        error: error.message || 'Login request timed out. Please check your internet connection and try again.',
      }
    }
    
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

