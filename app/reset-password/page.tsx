import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import ResetPasswordForm from './ResetPasswordForm'

/**
 * Reset Password Page
 * 
 * This page is accessed via the link sent in the password reset email.
 * The link contains a token that Supabase uses to authenticate the user.
 * 
 * IMPORTANT: Make sure the redirect URL is configured in your Supabase dashboard:
 * 1. Go to Authentication > URL Configuration
 * 2. Add http://localhost:3000/reset-password to Redirect URLs
 * 3. Add http://localhost:3000/** as a wildcard
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; type?: string; error?: string; error_description?: string }
}) {
  // Check for errors in the URL (from Supabase)
  if (searchParams.error || searchParams.error_description) {
    // Redirect to forgot password with error
    redirect(`/forgot-password?error=${encodeURIComponent(searchParams.error_description || searchParams.error || 'Invalid or expired reset link')}`)
  }

  const supabase = await createServerComponentClient()
  
  // Check if user has a valid session (from the reset link) using getUser() for security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only redirect if explicitly no user AND no error to show
  // This allows the form to show and handle the error client-side if needed

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Brand Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Wheely
          </h1>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Set new password
            </h2>
            <p className="text-gray-500 text-sm">
              Enter your new password below
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}

