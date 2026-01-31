import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import LoginForm from './LoginForm'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Login Page for Partners
 * 
 * Split-screen layout matching reference design:
 * - Left: Dark blue background with branding and messaging
 * - Right: White background with login form
 */
export default async function LoginPage() {
  const supabase = await createServerComponentClient()
  
  // Check if user is already authenticated using getUser() for security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-urbanist">
      {/* Left Panel - Dark Blue Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo - Top Left */}
          <div className="mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-900 rounded-full"></div>
              </div>
              <span className="text-white text-2xl font-bold">Wheely</span>
            </div>
          </div>

          {/* Main Content - Centered Vertically */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Menaxhoni biznesin tuaj të makinave me lehtësi.
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Hyni në panelin e partnerëve për të kontrolluar flotën, rezervimet dhe performancën.
            </p>
          </div>

          {/* Footer - Bottom */}
          <div className="mt-auto flex items-center justify-between text-blue-200 text-sm">
            <span>Copyright © {currentYear} Wheely</span>
            <a href="#" className="hover:text-white transition-colors">
              Politika e Privatësisë
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel - White Background with Login Form */}
      <div className="flex-1 lg:w-1/2 bg-white flex items-center justify-center p-4 sm:p-6 md:p-8 safe-area-inset-top safe-area-inset-bottom">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="lg:hidden mb-6 sm:mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full"></div>
              </div>
              <span className="text-blue-900 text-xl sm:text-2xl font-bold">Wheely</span>
            </div>
          </div>

          {/* Login Form */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Mirë se vini
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Hyni për të menaxhuar biznesin tuaj
            </p>
          </div>

          <LoginForm />

          {/* Mobile Footer */}
          <div className="lg:hidden mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
            <div className="mb-2">
              <a href="#" className="hover:text-gray-700 transition-colors inline-block">
                Politika e Privatësisë
              </a>
            </div>
            <div>Copyright © {currentYear} Wheely</div>
          </div>
        </div>
      </div>
    </div>
  )
}
