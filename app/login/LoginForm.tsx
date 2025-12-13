'use client'

import { useState, FormEvent } from 'react'
import { loginAction, type LoginFormData } from '@/lib/server/auth/login-actions'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:14',message:'handleSubmit entry',data:{email,hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setError(null)
    setIsLoading(true)

    try {
      const formData: LoginFormData = { email, password }
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:21',message:'Before loginAction call',data:{email,hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const result = await loginAction(formData)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:24',message:'After loginAction call',data:{hasError:!!result.error,hasSuccess:!!result.success,hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result.success) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:30',message:'Before window.location redirect',data:{hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Force a hard navigation to ensure cookies are picked up
        // router.push + refresh doesn't always work with server-side auth
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      // Log the full error to console for debugging
      console.error('Login form error:', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        error: err,
      })
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:44',message:'LoginForm catch block',data:{error:err?.message,errorString:String(err),errorName:err?.name,errorStack:err?.stack?.substring(0,200),hypothesis:'B'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const errorMessage = err?.message?.toLowerCase() || ''
      const errorString = String(err).toLowerCase()
      
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch') ||
        errorString.includes('network') ||
        errorString.includes('connection')
      ) {
        setError('Connection couldn\'t be made to database. Please check your internet connection and try again.')
      } else {
        // Show the actual error message if available, otherwise generic message
        setError(err?.message || 'An unexpected error occurred. Please try again.')
      }
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-bold text-gray-700 uppercase tracking-wide"
        >
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 bg-white hover:border-blue-300"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-gray-700 uppercase tracking-wide"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 bg-white hover:border-blue-300"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 animate-slide-in-top">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white py-4 px-6 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </button>
    </form>
  )
}

