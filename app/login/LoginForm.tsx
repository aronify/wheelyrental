'use client'

import { useState, FormEvent } from 'react'
import { loginAction, type LoginFormData } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formData: LoginFormData = { email, password }
      const result = await loginAction(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result.success) {
        // Redirect to dashboard on success
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
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
        setError('An unexpected error occurred. Please try again.')
      }
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-700"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
          placeholder="Enter your email"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-700"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-900 hover:text-blue-800 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-900 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  )
}

