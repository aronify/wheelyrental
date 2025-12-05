import type { Metadata, Viewport } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wheely - Owner Portal',
  description: 'Manage your cars and bookings',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className="font-urbanist">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

