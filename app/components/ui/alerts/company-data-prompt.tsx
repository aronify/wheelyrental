'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import Link from 'next/link'

interface CompanyDataPromptProps {
  hasMinimalData: boolean
}

export default function CompanyDataPrompt({ hasMinimalData }: CompanyDataPromptProps) {
  const { t } = useLanguage()

  // Don't show if company has minimal data
  if (hasMinimalData) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-amber-900 mb-1">
            {t.companyDataRequiredTitle || 'Complete Your Company Information'}
          </h3>
          <p className="text-sm text-amber-800 mb-3">
            {t.companyDataRequiredMessage || 'Please add your company name, email, and phone number to continue using the dashboard.'}
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            {t.updateCompanyInfo || 'Update Company Info'}
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}


