/**
 * Quick Start Guide Component
 * 
 * A contextual, progressive onboarding guide for new partners.
 * Non-intrusive, dismissible, and tracks completion across profile, locations, and cars setup.
 * 
 * Design principles:
 * - Fits seamlessly into existing design system (blue primary, clean cards)
 * - Mobile-first with responsive behavior
 * - Guides without gating - users can dismiss or skip
 * - Shows clear progress with visual indicators
 * - Bilingual (English/Albanian) using existing i18n
 */

'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import Link from 'next/link'
import { CheckCircle, Circle, ChevronRight, X, Rocket } from 'lucide-react'

interface QuickStartGuideProps {
  profileComplete: boolean
  hasLocations: boolean
  hasCars: boolean
  progress: number
  onDismiss?: () => void
}

export default function QuickStartGuide({
  profileComplete,
  hasLocations,
  hasCars,
  progress,
  onDismiss,
}: QuickStartGuideProps) {
  const { t } = useLanguage()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Don't show if dismissed or complete
  if (isDismissed || progress === 100) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const steps = [
    {
      id: 'profile',
      title: t.quickStartProfileTitle || 'Complete Your Profile',
      description: t.quickStartProfileDesc || 'Add your company details to get started',
      href: '/profile',
      completed: profileComplete,
      ctaText: profileComplete ? (t.view || 'View') : (t.completeNow || 'Complete Now'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'locations',
      title: t.quickStartLocationsTitle || 'Add Pickup Locations',
      description: t.quickStartLocationsDesc || 'Set up where customers can get your cars',
      href: '/locations',
      completed: hasLocations,
      ctaText: hasLocations ? (t.manage || 'Manage') : (t.addLocations || 'Add Locations'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'cars',
      title: t.quickStartCarsTitle || 'Add Your First Vehicle',
      description: t.quickStartCarsDesc || 'List your cars to start receiving bookings',
      href: '/cars',
      completed: hasCars,
      ctaText: hasCars ? (t.viewFleet || 'View Fleet') : (t.addCar || 'Add Vehicle'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ]

  const completedCount = steps.filter(s => s.completed).length

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6 transition-all duration-300">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg">
                {t.quickStartTitle || 'Quick Start Guide'}
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm">
                {t.quickStartSubtitle || `${completedCount} of ${steps.length} steps completed`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Progress Circle - Hidden on mobile */}
            <div className="hidden sm:flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${progress * 1.257} 125.7`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-white font-bold text-sm">
                {progress}%
              </span>
            </div>

            {/* Mobile: Simple percentage */}
            <div className="sm:hidden text-white font-bold text-sm bg-white/20 px-3 py-1 rounded-full">
              {progress}%
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDismiss()
              }}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
              aria-label={t.dismiss || 'Dismiss'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar - Mobile Only */}
        <div className="sm:hidden mt-3">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                step.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {/* Step Icon & Status */}
              <div className="flex-shrink-0 pt-0.5">
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm sm:text-base ${
                      step.completed ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs sm:text-sm mt-1 ${
                      step.completed ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={step.href}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation ${
                      step.completed
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-900 text-white hover:bg-blue-800 shadow-sm'
                    }`}
                  >
                    {step.ctaText}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Completion Message */}
          {completedCount === steps.length && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-green-900 text-sm sm:text-base">
                    {t.quickStartComplete || '🎉 All Set!'}
                  </h4>
                  <p className="text-green-700 text-xs sm:text-sm mt-0.5">
                    {t.quickStartCompleteMsg || 'Your profile is ready. You can now start receiving bookings!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
