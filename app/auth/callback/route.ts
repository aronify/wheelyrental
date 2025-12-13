import { createServerComponentClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

/**
 * Auth Callback Handler
 * 
 * This route handles the authentication callback from Supabase.
 * When users click the password reset link, Supabase redirects here with auth tokens.
 * We exchange the tokens for a session and redirect to the reset password page.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/forgot-password?error=${encodeURIComponent(
        errorDescription || error
      )}`
    )
  }

  // Exchange code for session
  if (code) {
    const supabase = await createServerComponentClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/forgot-password?error=${encodeURIComponent(
          'Failed to authenticate. Please try again.'
        )}`
      )
    }

    // Check if this is a password reset flow
    // Redirect to reset password page
    return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
  }

  // No code provided, redirect to forgot password
  return NextResponse.redirect(
    `${requestUrl.origin}/forgot-password?error=${encodeURIComponent(
      'Invalid authentication link'
    )}`
  )
}


