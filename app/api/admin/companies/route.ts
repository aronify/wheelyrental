/**
 * API Route: Admin list companies
 *
 * Returns id and name for Create User form dropdown.
 * Caller must be authenticated with app_metadata.role === 'admin'.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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

    const admin = createAdminClient()
    const { data: companies, error } = await admin
      .from('companies')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('[Admin Companies] list failed:', error.message)
      return NextResponse.json({ error: 'Failed to load companies' }, { status: 500 })
    }

    return NextResponse.json({ companies: companies ?? [] })
  } catch (err) {
    console.error('[Admin Companies] Unexpected error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
