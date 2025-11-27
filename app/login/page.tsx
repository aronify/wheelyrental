import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import LoginForm from './LoginForm'

/**
 * Login Page for Car Owners
 * 
 * This page handles authentication for car owners (rental providers).
 * Authenticated users are automatically redirected to the dashboard.
 */
export default async function LoginPage() {
  const supabase = await createServerComponentClient()
  
  // Check if user is already authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Brand Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Wheely
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to manage your vehicles and bookings
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

