'use client'

import { useEffect } from 'react'

export default function ErrorHandler() {
  useEffect(() => {
    // Global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      // Ignore control-flow errors - they are part of Next.js routing
      const isControlFlowError = 
        event.message?.includes('NEXT_REDIRECT') ||
        event.message?.includes('NEXT_NOT_FOUND') ||
        event.message?.includes('Error in input stream') ||
        event.error?.name === 'NEXT_REDIRECT' ||
        event.error?.name === 'NEXT_NOT_FOUND'

      if (isControlFlowError) {
        // Don't log or handle control-flow errors - they're expected
        return
      }

      // Log real runtime errors only
      console.error('Unhandled JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
      })
    }

    // Unhandled promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Ignore control-flow errors
      const isControlFlowError = 
        event.reason?.message?.includes('NEXT_REDIRECT') ||
        event.reason?.message?.includes('NEXT_NOT_FOUND') ||
        event.reason?.message?.includes('Error in input stream') ||
        event.reason?.name === 'NEXT_REDIRECT' ||
        event.reason?.name === 'NEXT_NOT_FOUND'

      if (isControlFlowError) {
        return
      }

      // Log real runtime errors only
      console.error('Unhandled Promise Rejection:', {
        reason: event.reason,
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}

