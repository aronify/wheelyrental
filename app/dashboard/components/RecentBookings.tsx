'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Booking } from '@/types/booking'
import Link from 'next/link'
import Image from 'next/image'

interface RecentBookingsProps {
  bookings: Booking[]
}

export default function RecentBookings({ bookings }: RecentBookingsProps) {
  const { t, language } = useLanguage()

  // Get the 5 most recent bookings
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'picked_up':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'returned':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t.statusPending
      case 'confirmed':
        return t.statusConfirmed
      case 'picked_up':
        return t.statusPickedUp
      case 'returned':
        return t.statusReturned
      case 'cancelled':
        return t.statusCancelled
      default:
        return status
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (recentBookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t.recentBookings}</h2>
        </div>
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">{t.noResults}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t.recentBookings}</h2>
          <Link
            href="/bookings"
            className="text-sm font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            {t.viewAllBookings}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t.car}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t.customer}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t.dates}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t.status}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t.totalPrice}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={booking.carImageUrl}
                        alt={booking.carName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.carName}</p>
                      <p className="text-sm text-gray-500">{booking.carPlate}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{booking.customerName}</p>
                  <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{formatDate(booking.startDateTime)}</p>
                  <p className="text-sm text-gray-500">{formatDate(booking.endDateTime)}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">€{booking.totalPrice.toFixed(2)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-gray-200">
        {recentBookings.map((booking) => (
          <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={booking.carImageUrl}
                  alt={booking.carName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{booking.carName}</p>
                <p className="text-sm text-gray-500">{booking.carPlate}</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {getStatusText(booking.status)}
                </span>
              </div>
              <p className="font-bold text-gray-900">€{booking.totalPrice.toFixed(0)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">{t.customer}</p>
                <p className="font-medium text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500">{t.dates}</p>
                <p className="font-medium text-gray-900 text-xs">
                  {formatDate(booking.startDateTime)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


