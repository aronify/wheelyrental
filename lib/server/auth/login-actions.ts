'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { withTimeout, TIMEOUTS, TimeoutError } from '@/lib/utils/timeout'
// Role assignment is now handled via API route after login
// This keeps server actions free of side effects during authentication
import { checkRateLimit, recordFailedAttempt } from '@/lib/security/rate-limiter'
import { sanitizeEmail, validateEmail } from '@/lib/security/input-validator'
import { logAuthAttempt, logRateLimitExceeded, logSuspiciousActivity } from '@/lib/security/security-logger'
import { headers } from 'next/headers'

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
 * Implements rate limiting, input validation, and security logging
 */
export async function loginAction(
  formData: LoginFormData
): Promise<LoginActionResult> {
  try {
    // Get client IP for rate limiting
    const headersList = await headers()
    const clientId = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     headersList.get('x-real-ip') || 
                     'unknown'

    // Validate and sanitize email
    if (!validateEmail(formData.email)) {
      logSuspiciousActivity(clientId, undefined, 'Invalid email format', { email: formData.email.substring(0, 3) + '***' })
      return {
        error: 'Email i pavlefshëm. Ju lutem kontrolloni email-in tuaj.',
      }
    }

    const sanitizedEmail = sanitizeEmail(formData.email)
    if (!sanitizedEmail) {
      return {
        error: 'Email i pavlefshëm. Ju lutem kontrolloni email-in tuaj.',
      }
    }

    // Check rate limit
    const rateLimit = checkRateLimit('login', clientId)
    if (!rateLimit.allowed) {
      logRateLimitExceeded(clientId, 'login')
      return {
        error: 'Shumë përpjekje të dështuara. Ju lutem provoni përsëri më vonë.',
      }
    }

    const supabase = await createServerActionClient()

    // Wrap auth operation with timeout
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: formData.password,
      }),
      TIMEOUTS.LOGIN,
      'Kërkesa për hyrje ka kaluar kohën e lejuar. Ju lutem kontrolloni lidhjen tuaj me internetin dhe provoni përsëri.'
    )

    if (error) {
      // Record failed attempt for rate limiting
      recordFailedAttempt('login', clientId)
      
      // Log authentication failure
      logAuthAttempt(clientId, sanitizedEmail, false, error.message)

      // Check for invalid credentials
      if (
        error.message === 'Invalid login credentials' ||
        error.code === 'invalid_credentials'
      ) {
        return {
          error: 'Email ose fjalëkalim i gabuar. Ju lutem kontrolloni kredencialet tuaja dhe provoni përsëri.',
        }
      }

      // Check for email not confirmed
      if (error.message?.includes('Email not confirmed')) {
        return {
          error: 'Ju lutem konfirmoni adresën tuaj të email-it para se të hyni. Kontrolloni kutinë tuaj për një lidhje konfirmimi.',
        }
      }

      // Check for database connection errors
      const errorMessage = error.message?.toLowerCase() || ''
      const errorCode = error.code?.toLowerCase() || ''
      
      // Connection errors - check for network/database connectivity issues
      // Exclude authentication-specific errors
      const isAuthError = (
        errorMessage.includes('invalid login') ||
        errorMessage.includes('invalid credentials') ||
        errorMessage.includes('email not confirmed') ||
        errorCode === 'invalid_credentials'
      )
      
      if (!isAuthError) {
        // Check for connection-related errors
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('failed to fetch') ||
          errorCode === 'pgrst301' || // Connection timeout
          errorCode === 'pgrst116' || // Connection refused
          error.message === 'fetch failed' ||
          (error.name === 'TypeError' && errorMessage.includes('fetch'))
        ) {
          return {
            error: 'Nuk mund të krijohet lidhja me bazën e të dhënave. Ju lutem kontrolloni lidhjen tuaj me internetin dhe provoni përsëri.',
          }
        }
      }

      // Generic error fallback
      return {
        error: 'Hyrja dështoi. Ju lutem provoni përsëri.',
      }
    }

    if (!data.session || !data.user) {
      recordFailedAttempt('login', clientId)
      logAuthAttempt(clientId, sanitizedEmail, false, 'No session created')
      return {
        error: 'Nuk u krijua sesion. Ju lutem provoni përsëri.',
      }
    }

    // Log successful authentication (non-blocking)
    logAuthAttempt(clientId, sanitizedEmail, true)

    // Role assignment is now handled client-side after page render via API route
    // This keeps the login action free of side effects and prevents streaming errors
    // The RoleAssignmentHandler component will call /api/assign-role after the dashboard loads

    // Revalidate in background (non-blocking)
    revalidatePath('/dashboard')
    
    // Return success immediately - no side effects in server action
    return { success: true }
  } catch (error: unknown) {
    // Get client ID for logging
    const headersList = await headers()
    const clientId = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    
    // Record failed attempt
    recordFailedAttempt('login', clientId)
    
    // Log error
    logSuspiciousActivity(
      clientId,
      undefined,
      'Login action exception',
      { errorType: error instanceof Error ? error.name : 'unknown' }
    )
    
    // Handle timeout errors specifically
    if (error instanceof TimeoutError) {
      return {
        error: error.message || 'Kërkesa për hyrje ka kaluar kohën e lejuar. Ju lutem kontrolloni lidhjen tuaj me internetin dhe provoni përsëri.',
      }
    }
    
    // Check for network/database connection errors in catch block
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
    const errorString = String(error).toLowerCase()
    const errorName = error instanceof Error ? error.name.toLowerCase() : ''
    
    // Connection errors - check for network/database connectivity issues
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('failed to fetch') ||
      errorString.includes('network') ||
      errorString.includes('connection') ||
      errorString.includes('fetch') ||
      (errorName === 'typeerror' && errorMessage.includes('fetch'))
    ) {
      return {
        error: 'Nuk mund të krijohet lidhja me bazën e të dhënave. Ju lutem kontrolloni lidhjen tuaj me internetin dhe provoni përsëri.',
      }
    }

    return {
      error: 'Ndodhi një gabim i papritur. Ju lutem provoni përsëri.',
    }
  }
}

