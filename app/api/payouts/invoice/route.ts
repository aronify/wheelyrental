import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

function getContentType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.'))
  return MIME_BY_EXT[ext.toLowerCase()] ?? 'application/octet-stream'
}

/**
 * GET /api/payouts/invoice?path=userId/filename.pdf
 *
 * Proxies the invoice file from Supabase Storage so it can be embedded
 * (iframe/img) without CORS/X-Frame-Options issues. Verifies the path
 * belongs to the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return new NextResponse('Server configuration error', { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path || typeof path !== 'string' || path.includes('..')) {
      return new NextResponse('Invalid path', { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for API routes
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!path.startsWith(user.id + '/')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { data, error } = await supabase.storage.from('invoices').download(path)

    if (error) {
      console.error('[invoice] Storage download error:', error.message)
      return new NextResponse('File not found', { status: 404 })
    }

    if (!data) {
      return new NextResponse('File not found', { status: 404 })
    }

    const contentType = getContentType(path)
    const fileName = path.slice(path.lastIndexOf('/') + 1)

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[invoice] Error:', err)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
