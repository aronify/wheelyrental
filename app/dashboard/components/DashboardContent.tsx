'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Booking } from '@/types/booking'
import DashboardHeader from './DashboardHeader'
import StatsCards from './StatsCards'
import RecentBookings from './RecentBookings'
import QuickAccessMenu from '@/app/components/QuickAccessMenu'
import Link from 'next/link'

interface DashboardContentProps {
  userEmail: string
  bookings: Booking[]
}

export default function DashboardContent({ userEmail, bookings }: DashboardContentProps) {
  const { t } = useLanguage()

  const featureCards = [
    {
      title: t.cars,
      description: t.carsSubtitle,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/cars',
      color: 'from-blue-500 to-blue-600',
      lightColor: 'from-blue-400 to-blue-500',
    },
    {
      title: t.bookings,
      description: t.bookingsSubtitle,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/bookings',
      color: 'from-purple-500 to-purple-600',
      lightColor: 'from-purple-400 to-purple-500',
      count: bookings.length,
    },
    {
      title: t.customers,
      description: t.customersSubtitle,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/customers',
      color: 'from-green-500 to-green-600',
      lightColor: 'from-green-400 to-green-500',
    },
    {
      title: t.calendar,
      description: t.calendarSubtitle,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/calendar',
      color: 'from-orange-500 to-orange-600',
      lightColor: 'from-orange-400 to-orange-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userEmail={userEmail} />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {t.welcomeBack}! 👋
          </h1>
          <p className="text-gray-600">
            {t.overview}
          </p>
        </div>

        {/* Quick Feature Access Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.quickActions}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.lightColor} text-white group-hover:bg-white/20 transition-colors duration-300`}>
                      {feature.icon}
                    </div>
                    {feature.count !== undefined && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-bold group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
                        {feature.count}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-white transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 group-hover:text-white/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-sm font-medium text-gray-900 group-hover:text-white transition-colors duration-300">
                    <span>{t.view}</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.overview}</h2>
          <StatsCards bookings={bookings} />
        </div>

        {/* Recent Bookings */}
        <div className="mb-6">
          <RecentBookings bookings={bookings} />
        </div>
      </main>
    </div>
  )
}

