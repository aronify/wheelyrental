'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'

/**
 * Global Error Boundary
 * 
 * IMPORTANT: This component must NOT render <html> or <body> tags.
 * Only app/layout.tsx is allowed to render those tags in Next.js App Router.
 * 
 * CRITICAL: This boundary must NOT catch Next.js control-flow errors (redirect/notFound).
 * Control-flow errors are returned as null to let Next.js router handle them.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Memoize control-flow error check to prevent recalculation on every render
  const isControlFlowError = useMemo(() => 
    error.message?.includes('NEXT_REDIRECT') ||
    error.message?.includes('NEXT_NOT_FOUND') ||
    error.message?.includes('Error in input stream') ||
    error.digest?.startsWith('NEXT_') ||
    error.name === 'NEXT_REDIRECT' ||
    error.name === 'NEXT_NOT_FOUND',
    [error.message, error.digest, error.name]
  )

  // Track logged errors to prevent duplicate logging
  const loggedErrors = useRef<Set<string>>(new Set())

  // Log errors only once per error digest
  useEffect(() => {
    if (isControlFlowError) {
      // Control-flow errors should not be logged or handled by error boundary
      return
    }

    // Use digest or message as unique identifier to prevent duplicate logs
    const errorId = error.digest || error.message || String(error)
    if (loggedErrors.current.has(errorId)) {
      return // Already logged this error
    }
    loggedErrors.current.add(errorId)

    // Log real runtime errors only once per error
    console.error('[Global Error Boundary] Caught runtime error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      timestamp: new Date().toISOString(),
    })
  }, [error.digest, error.message, error.name, isControlFlowError])

  // If this is a control-flow error, don't render error UI
  // Return null to let Next.js router handle it without interference
  if (isControlFlowError) {
    return null
  }

  // Render only valid children - NO <html> or <body> tags
  // Only render for real runtime errors, not control-flow errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Error
          </h1>
          <p className="text-gray-600 mb-6">
            {error.message || 'An unexpected error occurred.'}
          </p>
          
          {error.stack && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                Technical Details (click to expand)
              </summary>
              <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-48 text-gray-800">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/login"
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Back to Login
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Error details have been logged to the browser console. Please check the console for more information.
          </p>
        </div>
      </div>
    </div>
  )
}

