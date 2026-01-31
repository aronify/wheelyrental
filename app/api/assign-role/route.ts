/**
 * API Route for Role Assignment
 * 
 * This route handles partner role assignment in a server-only context.
 * It uses SUPABASE_SERVICE_ROLE_KEY which must NEVER be exposed to the client.
 * 
 * SECURITY:
 * - Only accessible server-side
 * - Uses service role key (server-only)
 * - Validates user authentication before assignment
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/assign-role
 * 
 * Assigns "partner" role to authenticated user if they don't have one.
 * This is a one-time assignment that happens on first login.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    // Create authenticated client to verify user
    // In API routes, cookies() works directly with the request
    const cookieStore = await cookies()
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for API routes - cookies are managed by Next.js
        },
      },
    })

    // Verify user is authenticated
    const { data: { user }, error: getUserError } = await supabase.auth.getUser()

    if (getUserError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check current role
    const currentRole = (user.app_metadata?.role as string) || null

    // If role already exists, return it
    if (currentRole !== null) {
      return NextResponse.json({
        success: true,
        role: currentRole,
        action: currentRole === 'partner' ? 'verified' : 'rejected',
      })
    }

    // Role is NULL - assign "partner" role atomically using Admin API
    // Admin client is created using dedicated utility that validates env vars at startup
    const adminClient = createAdminClient()

    // Update app_metadata.role atomically
    const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          role: 'partner',
        },
      }
    )

    if (updateError) {
      console.error('[RoleAssignment API] Failed to assign partner role:', {
        userId: user.id,
        error: updateError.message,
        code: updateError.code,
      })
      return NextResponse.json(
        { error: `Failed to assign role: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Verify the role was assigned
    const updatedRole = updateData.user?.app_metadata?.role as string | null
    if (updatedRole !== 'partner') {
      console.error('[RoleAssignment API] Role assignment verification failed:', {
        userId: user.id,
        expected: 'partner',
        actual: updatedRole,
      })
      return NextResponse.json(
        { error: 'Role assignment verification failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      role: 'partner',
      action: 'assigned',
    })
  } catch (error) {
    console.error('[RoleAssignment API] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

