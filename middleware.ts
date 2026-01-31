import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Protected routes that require partner role
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/cars',
  '/bookings',
  '/calendar',
  '/locations',
  '/profile',
  '/reviews',
  '/payouts',
]

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/',
]

/**
 * Middleware for handling Supabase session refresh and role verification
 * 
 * This middleware:
 * 1. Ensures user sessions are properly maintained
 * 2. Verifies partner role for protected routes
 * 3. Assigns partner role on first login (if role is NULL)
 * 4. Redirects non-partner users to customer site
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip role checking for public routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables. Please check your .env.local file.')
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: getUserError } = await supabase.auth.getUser()

    // If not authenticated and trying to access protected route, redirect to login
    if (getUserError || !user) {
      if (pathname.startsWith('/admin') || PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
      return response
    }

    // Admin routes: only app_metadata.role === 'admin' may access
    if (pathname.startsWith('/admin')) {
      const role = (user.app_metadata?.role as string) || null
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // Check role for protected routes
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      const role = (user.app_metadata?.role as string) || null

      // If role is NULL, it will be assigned on first page load (in the page component)
      // For now, allow access - the page component will handle role assignment
      if (role === null) {
        // Allow access - role will be assigned in the page component
        return response
      }

      // If role exists and is NOT "partner", redirect to customer site
      if (role !== 'partner') {
        const customerSiteUrl = process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || 'https://customer.wheely.com'
        
        // Sign out the user
        await supabase.auth.signOut()

        // Redirect to customer site
        return NextResponse.redirect(customerSiteUrl)
      }

      // Role is "partner" - allow access
      return response
    }

    // For other routes, just refresh session
    const { error } = await supabase.auth.getUser()
    if (error) {
      console.error('[Middleware] Error refreshing session:', {
        message: error.message,
        code: error.code,
        status: error.status,
      })
    }
  } catch (err: any) {
    console.error('[Middleware] Unexpected error:', {
      message: err?.message,
      stack: err?.stack,
      path: request.nextUrl.pathname,
    })
    // Continue with response - don't block the request
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

