'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import Link from 'next/link'
import { FileText, X } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/app/components/ui/alert'

/**
 * No Company Alert - shadcn-style
 * 
 * Shows when user doesn't have a company ID
 * Non-blocking - user can still see and use the platform
 * 
 * Design: Uses shadcn alert component with amber/orange styling
 */
export default function NoCompanyAlert() {
  const { t, language } = useLanguage()
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <Alert variant="warning" className="mb-6">
      <FileText className="size-5" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <AlertTitle className="text-amber-900 text-base font-semibold">
            {language === 'en' 
              ? 'Complete Your Profile' 
              : 'Plotëso Profilin Tënd'}
          </AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            {language === 'en' 
              ? 'Add your company details to unlock all features and start managing your fleet.' 
              : 'Shto detajet e kompanisë për të aksesuar të gjitha funksionet dhe menaxhuar flotën.'}
          </AlertDescription>
          <Link
            href="/profile"
            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-4 transition-colors"
          >
            {language === 'en' ? 'Complete Now' : 'Plotëso Tani'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors -mt-1 -mr-1"
          aria-label={language === 'en' ? 'Dismiss' : 'Mbyll'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </Alert>
  )
}
