import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import LoginForm from './LoginForm'

/**
 * Login Page for Car Owners
 * 
 * This page handles authentication for car owners (rental providers).
 * Authenticated users are automatically redirected to the dashboard.
 */
export default async function LoginPage() {
  const supabase = await createServerComponentClient()
  
  // Check if user is already authenticated using getUser() for security
  // getUser() validates with the server, unlike getSession() which only reads from cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white px-4 sm:px-6 lg:px-8">
      {/* Animated Background Blobs - Dark Blue */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb08_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb08_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-3">
            Wheely
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            Owner Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border-2 border-gray-100 animate-scale-fade">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Welcome back
            </h2>
            <p className="text-gray-600 text-base">
              Sign in to manage your vehicles and bookings
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

