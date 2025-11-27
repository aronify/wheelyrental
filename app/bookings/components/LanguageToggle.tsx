'use client'

import { useLanguage } from '@/contexts/LanguageContext'

/**
 * Language Toggle Component
 * 
 * Can be used in the dashboard layout or anywhere else
 * to toggle between English and Albanian
 */
export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
          language === 'en'
            ? 'bg-blue-900 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('al')}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
          language === 'al'
            ? 'bg-blue-900 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        AL
      </button>
    </div>
  )
}

