'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Client Component for Role Assignment
 * 
 * This component handles role assignment AFTER the page has fully rendered and hydrated.
 * It calls the API route to assign the "partner" role if the user doesn't have one.
 * 
 * IMPORTANT: This component is completely decoupled from RSC rendering:
 * - Only runs in browser (client-side)
 * - Uses useEffect to ensure it runs after mount
 * - Never blocks or interferes with server-side rendering
 * - Errors are isolated and don't affect the render stream
 */
export default function RoleAssignmentHandler({ userRole }: { userRole: string | null }) {
  const [assignmentStatus, setAssignmentStatus] = useState<'idle' | 'assigning' | 'assigned' | 'error'>('idle')
  const hasRunRef = useRef(false)

  useEffect(() => {
    // Prevent multiple runs
    if (hasRunRef.current) {
      return
    }

    // Only assign role if user doesn't have one (role is null)
    if (userRole !== null) {
      hasRunRef.current = true
      return // User already has a role, no action needed
    }

    // Mark as run to prevent duplicate calls
    hasRunRef.current = true

    // Assign role via API route - runs asynchronously after mount
    const assignRole = async () => {
      try {
        setAssignmentStatus('assigning')
        const response = await fetch('/api/assign-role', {
          method: 'POST',
          credentials: 'include', // Include cookies for authentication
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[RoleAssignmentHandler] Failed to assign role:', errorData.error)
          setAssignmentStatus('error')
          // Don't throw - errors are isolated and don't affect rendering
          return
        }

        const data = await response.json()
        if (data.success && data.action === 'assigned') {
          console.log('[RoleAssignmentHandler] ✅ Partner role assigned successfully')
          setAssignmentStatus('assigned')
          // Refresh the page to reflect the new role
          window.location.reload()
        } else {
          setAssignmentStatus('idle')
        }
      } catch (error) {
        console.error('[RoleAssignmentHandler] Error assigning role:', error)
        setAssignmentStatus('error')
        // Don't throw - errors are isolated and don't affect rendering
      }
    }

    // Run after a brief delay to ensure page is fully rendered and hydrated
    // This ensures the API call doesn't interfere with initial render
    const timeoutId = setTimeout(assignRole, 100)
    return () => clearTimeout(timeoutId)
  }, [userRole])

  // This component doesn't render anything - it's purely for side effects
  return null
}

