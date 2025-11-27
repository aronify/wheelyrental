'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, translations, type LanguageDictionary } from '@/lib/language'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: LanguageDictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('wheely-language') as Language
    if (savedLanguage === 'en' || savedLanguage === 'al') {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('wheely-language', lang)
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

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

