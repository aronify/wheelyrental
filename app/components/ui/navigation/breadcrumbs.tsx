'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/language-context'

export default function Breadcrumbs() {
  const pathname = usePathname()
  const { t } = useLanguage()

  // Don't show breadcrumbs on home/login pages
  if (pathname === '/' || pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return null
  }

  // Split the pathname into segments
  const segments = pathname.split('/').filter(Boolean)

  // Create breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`
    
    // Get label based on segment
    let label = segment.charAt(0).toUpperCase() + segment.slice(1)
    if (segment === 'dashboard') label = t.dashboard
    if (segment === 'bookings') label = t.bookings
    if (segment === 'cars') label = t.cars
    if (segment === 'calendar') label = t.calendar
    if (segment === 'profile') label = t.myProfile
    if (segment === 'payouts') label = t.requestPayout || 'Request Payout'
    
    return {
      label,
      path,
      isLast: index === segments.length - 1,
    }
  })

  // Add home breadcrumb at the start
  const fullBreadcrumbs = [
    { label: t.dashboard, path: '/dashboard', isLast: false },
    ...breadcrumbs.slice(1), // Skip the first since we already have dashboard
  ]

  if (fullBreadcrumbs.length <= 1) {
    return null // Don't show breadcrumbs if only on dashboard
  }

  // Always show dashboard as clickable in breadcrumbs
  fullBreadcrumbs[0].isLast = false

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4" aria-label="Breadcrumb">
      {fullBreadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          {index > 0 && (
            <svg
              className="w-4 h-4 text-gray-400 mx-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.path}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center gap-1"
            >
              {index === 0 && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

