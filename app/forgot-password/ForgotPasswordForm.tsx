'use client'

import { useState, FormEvent } from 'react'
import { forgotPasswordAction } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const result = await forgotPasswordAction(email)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result.success) {
        setSuccess(true)
        setIsLoading(false)
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push('/login')
        }, 3000)
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

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Check your email
          </h3>
          <p className="text-green-700 text-sm mb-4">
            If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <p className="text-green-600 text-xs">
            Redirecting to login page...
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-blue-900 hover:text-blue-800 transition-colors"
        >
          Back to login
        </Link>
      </div>
    )
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
          placeholder="Enter your email address"
          autoComplete="email"
        />
        <p className="text-xs text-gray-500 mt-1">
          We'll send you a link to reset your password
        </p>
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
            Sending...
          </span>
        ) : (
          'Send reset link'
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1 hover:gap-2"
        >
          <svg className="w-4 h-4 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to login
        </Link>
      </div>
    </form>
  )
}

