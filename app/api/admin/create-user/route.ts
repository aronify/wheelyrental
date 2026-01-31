/**
 * API Route: Admin Create User
 *
 * Server-only. Uses service role for auth.admin and company_members insert.
 * Caller must be authenticated with app_metadata.role === 'admin'.
 * Email-based auth only; no profiles table; no usernames.
 *
 * Flow: inviteUserByEmail creates the user and sends a password-setup invite
 * (Supabase sends the email when SMTP is configured). No password is set or
 * exposed. User sets password via the invite link. Link is never sent to frontend.
 *
 * SECURITY:
 * - Service role key used only in this route, never exposed to client.
 * - Generic error messages; do not leak whether email already exists.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GENERIC_ERROR = 'Unable to create user. Please check inputs or permissions.'

function validEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  const trimmed = email.trim()
  return trimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function validUuid(id: unknown): boolean {
  if (typeof id !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/** Map request role to company_members.role; default partner -> member */
function toCompanyRole(role: unknown): 'owner' | 'admin' | 'member' {
  if (role === 'owner' || role === 'admin') return role
  return 'member'
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    })

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser()

    if (getUserError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (user.app_metadata?.role as string) ?? null
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    if (body === null || typeof body !== 'object') {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    const { email: rawEmail, company_id: rawCompanyId, role: rawRole } = body as Record<string, unknown>

    if (!validEmail(rawEmail) || !validUuid(rawCompanyId)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    const email = (rawEmail as string).trim().toLowerCase()
    const companyId = rawCompanyId as string
    const companyMemberRole = toCompanyRole(rawRole)

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).limit(1).maybeSingle()
    if (!company) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    // inviteUserByEmail creates the user and sends the password-setup invite email (Supabase SMTP).
    // No password is set; user sets it via the invite link. Do not expose the link to the frontend.
    const {
      data: { user: newUser },
      error: inviteError,
    } = await admin.auth.admin.inviteUserByEmail(email)

    if (inviteError || !newUser) {
      console.error('[Admin Create User] inviteUserByEmail failed:', inviteError?.message ?? 'no user')
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    await admin.auth.admin.updateUserById(newUser.id, {
      app_metadata: { role: 'partner' },
    })

    const { error: memberError } = await admin.from('company_members').insert({
      company_id: companyId,
      user_id: newUser.id,
      role: companyMemberRole,
      is_active: true,
    })

    if (memberError) {
      console.error('[Admin Create User] company_members insert failed:', memberError.message)
      try {
        await admin.auth.admin.deleteUser(newUser.id)
      } catch {
        /* best-effort rollback */
      }
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admin Create User] Unexpected error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 })
  }
}
