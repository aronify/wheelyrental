'use client'

import { useEffect } from 'react'

/**
 * Global Error Boundary
 * 
 * Catches all unhandled errors in the application and makes them invisible to users.
 * Errors are logged to the console for debugging but no UI is shown.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    // Don't show any UI to the user
    console.error('[Global Error] Application error (invisible to user):', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  // Return null - completely invisible to users
  // Next.js will handle navigation/redirects automatically
  return null
}

