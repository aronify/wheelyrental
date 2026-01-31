import type { Metadata, Viewport } from 'next'
import { Figtree, Urbanist } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/language-context'

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
  adjustFontFallback: true,
})

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'Wheely - Partner Dashboard',
  description: 'Manage your car rental business',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sq" className={`${figtree.variable} ${urbanist.variable}`} data-scroll-behavior="smooth">
      <body className="font-sans">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

