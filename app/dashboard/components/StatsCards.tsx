'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Booking } from '@/types/booking'

interface StatsCardsProps {
  bookings: Booking[]
}

export default function StatsCards({ bookings }: StatsCardsProps) {
  const { t } = useLanguage()

  // Calculate stats
  const totalBookings = bookings.length
  const activeRentals = bookings.filter(b => b.status === 'picked_up').length
  const pendingApprovals = bookings.filter(b => b.status === 'pending').length
  
  // Calculate total revenue (sum of all bookings)
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
  
  // Calculate revenue this month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const thisMonthRevenue = bookings
    .filter(b => {
      const bookingDate = new Date(b.createdAt)
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
    })
    .reduce((sum, booking) => sum + booking.totalPrice, 0)

  const stats = [
    {
      title: t.totalBookings,
      value: totalBookings.toString(),
      change: '+12%',
      changeType: 'increase' as const,
      subtitle: t.vsLastMonth,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: t.activeRentals,
      value: activeRentals.toString(),
      change: null,
      changeType: null,
      subtitle: t.currentlyActive,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: t.totalRevenue,
      value: `€${totalRevenue.toFixed(0)}`,
      change: `€${thisMonthRevenue.toFixed(0)}`,
      changeType: 'neutral' as const,
      subtitle: t.thisMonth,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: t.pendingApprovals,
      value: pendingApprovals.toString(),
      change: null,
      changeType: null,
      subtitle: t.awaitingConfirmation,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </p>
              {stat.change && (
                <div className="flex items-center gap-1">
                  {stat.changeType === 'increase' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'increase'
                        ? 'text-green-600'
                        : stat.changeType === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">{stat.subtitle}</span>
                </div>
              )}
              {!stat.change && (
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              )}
            </div>
            <div className={`${stat.lightBg} ${stat.textColor} p-3 rounded-lg`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


