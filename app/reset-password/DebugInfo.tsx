'use client'

import { useState } from 'react'

/**
 * Debug Info Component
 * Shows configuration details for troubleshooting
 * Remove this in production!
 */
export default function DebugInfo() {
  const [showDebug, setShowDebug] = useState(false)

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>

      {showDebug && (
        <div className="mt-3 bg-gray-100 rounded-lg p-4 text-xs font-mono space-y-2">
          <div>
            <span className="text-gray-600">Site URL:</span>{' '}
            <span className="text-gray-900">
              {process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Supabase URL:</span>{' '}
            <span className="text-gray-900">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Current URL:</span>{' '}
            <span className="text-gray-900">{window.location.href}</span>
          </div>
          <div className="pt-2 border-t border-gray-300">
            <p className="text-gray-600 mb-2">Expected redirect URL in Supabase:</p>
            <p className="text-blue-600 break-all">
              {process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback
            </p>
          </div>
          <div className="pt-2 border-t border-gray-300">
            <p className="text-gray-600 mb-1">Steps to fix:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1">
              <li>Go to Supabase Dashboard</li>
              <li>Authentication → URL Configuration</li>
              <li>Add redirect URL: {process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback</li>
              <li>Add wildcard: {process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/**</li>
              <li>Save and restart dev server</li>
              <li>Request new reset email and test</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

