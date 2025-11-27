'use client'

import { useState, useMemo } from 'react'
import { Booking, BookingStatus } from '@/types/booking'
import { filterBookingsByStatus, filterBookingsByDateRange, searchBookings } from '@/types/booking'
import { useLanguage } from '@/contexts/LanguageContext'
import BookingsFilterBar from './BookingsFilterBar'
import BookingsTable from './BookingsTable'
import BookingDetailPanel from './BookingDetailPanel'
import BackButton from '@/app/components/BackButton'
import Breadcrumbs from '@/app/components/Breadcrumbs'

interface BookingsPageProps {
  initialBookings: Booking[]
}

export default function BookingsPage({ initialBookings }: BookingsPageProps) {
  const { t } = useLanguage()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Filter bookings based on all criteria
  const filteredBookings = useMemo(() => {
    let result = bookings

    // Apply search filter
    result = searchBookings(result, searchTerm)

    // Apply status filter
    result = filterBookingsByStatus(result, statusFilter)

    // Apply date range filter
    const fromDate = dateFrom ? new Date(dateFrom) : null
    const toDate = dateTo ? new Date(dateTo) : null
    result = filterBookingsByDateRange(result, fromDate, toDate)

    return result
  }, [bookings, searchTerm, statusFilter, dateFrom, dateTo])

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsPanelOpen(true)
  }

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      )
    )
    // Update selected booking if it's the one being changed
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: newStatus })
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label={t.back} />
        <Breadcrumbs />
      </div>
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.bookings}</h1>
        <p className="text-gray-600">{t.bookingsSubtitle}</p>
      </div>

      {/* Filter Bar */}
      <BookingsFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Table */}
      <BookingsTable bookings={filteredBookings} onViewBooking={handleViewBooking} />

      {/* Detail Panel */}
      <BookingDetailPanel
        booking={selectedBooking}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false)
          setSelectedBooking(null)
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

