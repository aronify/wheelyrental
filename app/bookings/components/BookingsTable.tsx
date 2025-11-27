'use client'

import { Car, User, MapPin, Calendar, Phone, Eye } from 'lucide-react'
import { Booking, BookingStatus } from '@/types/booking'
import { useLanguage } from '@/contexts/LanguageContext'

interface BookingsTableProps {
  bookings: Booking[]
  onViewBooking: (booking: Booking) => void
}

function getStatusBadgeClass(status: BookingStatus): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  switch (status) {
    case 'pending':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'confirmed':
      return `${baseClasses} bg-blue-100 text-blue-800`
    case 'picked_up':
      return `${baseClasses} bg-purple-100 text-purple-800`
    case 'returned':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function BookingsTable({ bookings, onViewBooking }: BookingsTableProps) {
  const { t } = useLanguage()

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium">{t.noResults}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.car}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.customer}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.dates}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.pickup}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.dropoff}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.status}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.totalPrice}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewBooking(booking)}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.carName}</div>
                      <div className="text-xs text-gray-500">{booking.carPlate}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {booking.customerPhone}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div className="text-sm text-gray-900">
                      <div>{formatDate(new Date(booking.startDateTime))}</div>
                      <div className="text-xs text-gray-500">
                        → {formatDate(new Date(booking.endDateTime))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{booking.pickupLocation}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{booking.dropoffLocation}</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={getStatusBadgeClass(booking.status)}>
                    {booking.status === 'pending' && t.statusPending}
                    {booking.status === 'confirmed' && t.statusConfirmed}
                    {booking.status === 'picked_up' && t.statusPickedUp}
                    {booking.status === 'returned' && t.statusReturned}
                    {booking.status === 'cancelled' && t.statusCancelled}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    €{booking.totalPrice.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewBooking(booking)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {t.view}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

