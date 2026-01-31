'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function QuickAccessMenu() {
  const { t } = useLanguage()
  const pathname = usePathname()

  // Main navigation items - most used pages
  // Note: Locations and Reviews are now accessible only through the Cars tab (car info panel)
  const mainMenuItems = [
    {
      label: t.dashboard,
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: t.bookings,
      href: '/bookings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: t.cars,
      href: '/cars',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: t.calendar,
      href: '/calendar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: t.payouts || 'Payouts',
      href: '/payouts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t.profile || 'Profile',
      href: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-inset-bottom"
        role="navigation"
        aria-label="Main navigation"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="grid grid-cols-6 h-14 min-h-[56px] xs:h-16 max-w-screen-xl mx-auto w-full">
          {mainMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 xs:gap-1 min-w-0 flex-1 py-2 touch-manipulation transition-all duration-200 hover:bg-gray-50 active:scale-95 active:bg-gray-100 ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 xs:w-5 xs:h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className={`text-[8px] xs:text-[9px] font-medium leading-tight text-center truncate w-full px-0.5 max-w-[52px] xs:max-w-[60px] ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 xs:w-8 h-0.5 bg-blue-600 rounded-b-full" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

