'use client'

import { useState } from 'react'
import { X, Car, User, MapPin, Calendar, Phone, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Booking, BookingStatus } from '@/types/booking'
import { useLanguage } from '@/contexts/LanguageContext'

interface BookingDetailPanelProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (bookingId: string, newStatus: BookingStatus) => void
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function BookingDetailPanel({
  booking,
  isOpen,
  onClose,
  onStatusChange,
}: BookingDetailPanelProps) {
  const { t } = useLanguage()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  if (!booking || !isOpen) return null

  const handleStatusAction = (newStatus: BookingStatus) => {
    onStatusChange(booking.id, newStatus)
    // Show success notification
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
      onClose()
    }, 2000)
  }

  const getStatusActions = () => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleStatusAction('confirmed')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              {t.markAsConfirmed}
            </button>
            <button
              onClick={() => handleStatusAction('cancelled')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              {t.cancelBooking}
            </button>
          </div>
        )
      case 'confirmed':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleStatusAction('picked_up')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              {t.markAsPickedUp}
            </button>
            <button
              onClick={() => handleStatusAction('cancelled')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              {t.cancelBooking}
            </button>
          </div>
        )
      case 'picked_up':
        return (
          <button
            onClick={() => handleStatusAction('returned')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            {t.markAsReturned}
          </button>
        )
      case 'returned':
      case 'cancelled':
        return null
      default:
        return null
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${
          isOpen ? 'opacity-100 z-[60]' : 'opacity-0 pointer-events-none -z-10'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 lg:w-[28rem] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0 z-[70]' : 'translate-x-full -z-10'
        }`}
      >
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="absolute top-4 left-4 right-4 z-20 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t.bookingUpdated}</span>
          </div>
        )}
        
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">{t.bookingDetails}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t.close}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Car Image */}
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={booking.carImageUrl}
              alt={booking.carName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Car+Image'
              }}
            />
          </div>

          {/* Car Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Car className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{booking.carName}</h3>
                <p className="text-sm text-gray-500">{booking.carPlate}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{t.customer}</h4>
                <p className="text-base text-gray-900">{booking.customerName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Phone className="w-4 h-4" />
                  {booking.customerPhone}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{t.dates}</h4>
                <p className="text-sm text-gray-900 mt-1">
                  <strong>{t.pickup}:</strong> {formatDate(new Date(booking.startDateTime))}
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  <strong>{t.dropoff}:</strong> {formatDate(new Date(booking.endDateTime))}
                </p>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-700">{t.pickup}</h4>
                  <p className="text-sm text-gray-900">{booking.pickupLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-700">{t.dropoff}</h4>
                  <p className="text-sm text-gray-900">{booking.dropoffLocation}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{t.status}</h4>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : booking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'picked_up'
                      ? 'bg-purple-100 text-purple-800'
                      : booking.status === 'returned'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {booking.status === 'pending' && t.statusPending}
                  {booking.status === 'confirmed' && t.statusConfirmed}
                  {booking.status === 'picked_up' && t.statusPickedUp}
                  {booking.status === 'returned' && t.statusReturned}
                  {booking.status === 'cancelled' && t.statusCancelled}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{t.totalPrice}</h4>
                <p className="text-xl font-bold text-gray-900">€{booking.totalPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{t.createdAt}</h4>
                <p className="text-sm text-gray-900">{formatDate(new Date(booking.createdAt))}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {getStatusActions() && (
            <div className="pt-4 border-t border-gray-200">
              {getStatusActions()}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

