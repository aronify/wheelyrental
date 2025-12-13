'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Language, translations, type LanguageDictionary } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: LanguageDictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // CRITICAL: Always initialize with 'en' to match server-side rendering
  // This prevents hydration mismatch errors
  // We'll update from localStorage AFTER hydration completes in useEffect
  const [language, setLanguageState] = useState<Language>('en')
  const hasInitialized = useRef(false)

  // Load language from localStorage AFTER hydration is complete
  // This ensures server and client render the same initial content
  // CRITICAL: Must not throw or cause re-renders that trigger routing
  // Only run once after mount - use ref to prevent loops (refs don't trigger re-renders)
  useEffect(() => {
    // Prevent multiple runs using ref (refs don't cause re-renders)
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    try {
      if (typeof window === 'undefined') return
      
      const savedLanguage = localStorage.getItem('wheely-language') as Language
      if (savedLanguage === 'en' || savedLanguage === 'al') {
        setLanguageState(savedLanguage)
      }
    } catch (err: any) {
      // Silently fail - don't break the app if localStorage is unavailable
    }
  }, []) // Empty dependency array - only run once after mount

  const setLanguage = useCallback((lang: Language) => {
    try {
      setLanguageState(lang)
      if (typeof window !== 'undefined') {
        localStorage.setItem('wheely-language', lang)
      }
    } catch (err: any) {
      // Silently fail - don't break the app
    }
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  // Only recreate when language actually changes
  const value: LanguageContextType = useMemo(() => {
    return {
      language,
      setLanguage,
      t: translations[language],
    }
  }, [language, setLanguage])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

