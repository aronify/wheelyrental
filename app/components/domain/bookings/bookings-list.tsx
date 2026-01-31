'use client'

import { useState, useMemo } from 'react'
import { Booking, BookingStatus } from '@/types/booking'
import { useLanguage } from '@/lib/i18n/language-context'
import Breadcrumbs from '@/app/components/ui/navigation/breadcrumbs'
import { updateBookingStatusAction } from '@/lib/server/data/bookings'
import { Calendar, Clock, User, Car as CarIcon, MapPin, CheckCircle, XCircle, AlertCircle, Search, Filter, FileText, AlertTriangle, Phone, Mail, X, Send, MessageSquare, Receipt } from 'lucide-react'
import CustomDropdown from '@/app/components/ui/dropdowns/custom-dropdown'

interface BookingsPageRedesignedProps {
  initialBookings: Booking[]
}

type ViewFilter = 'all' | 'pending' | 'today' | 'upcoming'

// Helper function to safely render location (handles both string and object formats)
const getLocationName = (location: string | { id: string; name: string } | undefined): string => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  return location.name || '';
}

// Start of day (00:00) in local time - for "button only at 00:00 of booking date"
const startOfDay = (d: Date): Date => {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

// Booking status order for timeline
const STATUS_ORDER: BookingStatus[] = ['pending', 'confirmed', 'picked_up', 'returned']
const isStatusReached = (current: BookingStatus, step: BookingStatus): boolean => {
  const curIdx = STATUS_ORDER.indexOf(current)
  const stepIdx = STATUS_ORDER.indexOf(step)
  if (current === 'cancelled') return false
  return curIdx >= stepIdx
}

export default function BookingsPageRedesigned({ initialBookings }: BookingsPageRedesignedProps) {
  const { t } = useLanguage()
  // Use only real bookings from database (no mock data)
  const [bookings, setBookings] = useState<any[]>(initialBookings)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [isFineModalOpen, setIsFineModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  })
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [claimForm, setClaimForm] = useState({
    description: '',
    damageType: '',
    estimatedCost: '',
    insurance: false
  })
  const [claimPhotos, setClaimPhotos] = useState<File[]>([])
  const [fineForm, setFineForm] = useState({
    details: '',
    fineType: '',
    finePrice: '',
  })
  const [finePhotos, setFinePhotos] = useState<File[]>([])

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = bookings

    // Search filter
    if (searchTerm) {
      result = result.filter((booking) =>
        booking.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.customer as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking as any).customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car?.model?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((booking) => booking.status === statusFilter)
    }

    // View filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (viewFilter === 'pending') {
      result = result.filter((booking) => booking.status === 'pending')
    } else if (viewFilter === 'today') {
      result = result.filter((booking) => {
        const startDate = new Date((booking as any).startTs || (booking as any).pickup_date || (booking as any).startDate || (booking as any).startDateTime)
        return startDate >= today && startDate < tomorrow
      })
    } else if (viewFilter === 'upcoming') {
      result = result.filter((booking) => {
        const startDate = new Date((booking as any).startTs || (booking as any).pickup_date || (booking as any).startDate || (booking as any).startDateTime)
        return startDate > now
      })
    }

    // Sort: ended (returned, cancelled) to the bottom; then by start date descending
    const startTs = (b: any) => new Date(b.startTs || b.start_date_time || b.pickup_date || b.startDate || b.createdAt || 0).getTime()
    return [...result].sort((a, b) => {
      const aEnded = a.status === 'returned' || a.status === 'cancelled'
      const bEnded = b.status === 'returned' || b.status === 'cancelled'
      if (aEnded !== bEnded) return aEnded ? 1 : -1
      return startTs(b) - startTs(a)
    })
  }, [bookings, searchTerm, statusFilter, viewFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      today: bookings.filter((b: any) => {
        const startDate = new Date(b.startTs || b.pickup_date || b.pickupDate || b.startDate || b.startDateTime)
        return startDate >= today && startDate < tomorrow
      }).length,
      upcoming: bookings.filter((b: any) => {
        const startDate = new Date(b.startTs || b.pickup_date || b.pickupDate || b.startDate || b.startDateTime)
        return startDate > now
      }).length,
      revenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
    }
  }, [bookings])

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    const result = await updateBookingStatusAction(bookingId, newStatus)
    if (result.success) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
      showSuccess(t.bookingUpdated || 'Booking updated successfully!')
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }
    } else {
      showError(result.error || 'Failed to update booking')
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const showError = (message: string) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(''), 3000)
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'picked_up':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'returned':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'picked_up':
        return <CarIcon className="w-4 h-4" />
      case 'returned':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return t.statusPending || 'Pending'
      case 'confirmed':
        return t.statusConfirmed || 'Confirmed'
      case 'picked_up':
        return t.statusPickedUp || 'Picked Up'
      case 'returned':
        return t.statusReturned || 'Returned'
      case 'cancelled':
        return t.statusCancelled || 'Cancelled'
      default:
        return status
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 pb-20 lg:pb-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <Breadcrumbs />

      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative px-4 xs:px-5 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{t.bookings || 'Bookings'}</h1>
                  <p className="text-blue-200 text-xs">{t.bookingsSubtitle || 'Manage all your rental bookings'}</p>
                </div>
              </div>

              {/* Stats Pills - Minimalist */}
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</span>
                  <span className="text-white/90 text-xs sm:text-sm font-medium">{t.totalBookings || 'Total'}</span>
                </div>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-amber-400/30 backdrop-blur-sm rounded-full border border-amber-300/30">
                    <span className="text-xl sm:text-2xl font-bold text-white">{stats.pending}</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{t.statusPending || 'Pending'}</span>
                  </div>
                )}
                {stats.today > 0 && (
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-400/30 backdrop-blur-sm rounded-full border border-emerald-300/30">
                    <span className="text-xl sm:text-2xl font-bold text-white">{stats.today}</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{t.today || 'Today'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-medium">{t.totalRevenue || 'Total Revenue'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">€{stats.revenue.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewFilter('all')}
              className={`min-h-[38px] px-3 py-2 rounded-lg font-medium transition-all text-sm touch-manipulation ${
                viewFilter === 'all'
                  ? 'bg-slate-600 text-white shadow-md active:bg-slate-700'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200 hover:bg-gray-200'
              }`}
            >
              {t.all || 'All'}
            </button>
            <button
              onClick={() => setViewFilter('pending')}
              className={`min-h-[38px] px-3 py-2 rounded-lg font-medium transition-all text-sm touch-manipulation ${
                viewFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-md active:bg-amber-700'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">{t.statusPending || 'Pending'}</span>
                <span className="xs:hidden">P</span>
              </span>
            </button>
            <button
              onClick={() => setViewFilter('today')}
              className={`min-h-[38px] px-3 py-2 rounded-lg font-medium transition-all text-sm touch-manipulation ${
                viewFilter === 'today'
                  ? 'bg-emerald-600 text-white shadow-md active:bg-emerald-700'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-1.5">
                <Clock className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                {t.today || 'Today'}
              </span>
            </button>
            <button
              onClick={() => setViewFilter('upcoming')}
              className={`min-h-[38px] px-3 py-2 rounded-lg font-medium transition-all text-sm touch-manipulation ${
                viewFilter === 'upcoming'
                  ? 'bg-violet-600 text-white shadow-md active:bg-violet-700'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-1.5">
                <Calendar className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span>{t.upcomingBookings || 'Upcoming'}</span>
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchByCustomerOrCar || 'Search by customer or car...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm min-h-[38px] touch-manipulation"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <CustomDropdown
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as BookingStatus | 'all')}
              options={[
                { value: 'all', label: t.all || 'All' },
                { value: 'pending', label: t.statusPending || 'Pending' },
                { value: 'confirmed', label: t.statusConfirmed || 'Confirmed' },
                { value: 'picked_up', label: t.statusPickedUp || 'Picked Up' },
                { value: 'returned', label: t.statusReturned || 'Returned' },
                { value: 'cancelled', label: t.statusCancelled || 'Cancelled' },
              ]}
              placeholder={t.filterByStatus || 'Filter by Status'}
              icon={<Filter className="w-5 h-5 text-gray-400" />}
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.noResults || 'No bookings found'}</h3>
          <p className="text-sm text-gray-500">{t.noResults || 'Try adjusting your filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {filteredBookings.map((booking, index) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 active:shadow-md transition-all duration-200 hover:border-blue-200 hover:shadow-md relative touch-manipulation animate-fade-in animate-slide-in"
              style={{
                animationDelay: `${Math.min(index * 40, 400)}ms`,
                animationFillMode: 'both'
              }}
            >

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3">
                {/* Left: Customer & Car Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    {/* Car Image */}
                    {booking.car?.imageUrl && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={booking.car.imageUrl}
                          alt={`${booking.car.make} ${booking.car.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Customer */}
                      <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {[booking.customer?.firstName, booking.customer?.lastName].filter(Boolean).join(' ') || (booking as any).customerName || booking.customer?.name || '—'}
                        </span>
                      </div>

                      {/* Car */}
                      <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
                        <CarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">
                          {booking.car?.make && (booking.car?.model || booking.car?.year) ? `${booking.car.make} ${booking.car.model || ''} ${booking.car.year || ''}`.trim() : booking.car?.make || booking.car?.model || '—'}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-600">
                        {(() => {
                          const startDate = (booking as any).startTs || (booking as any).pickup_date || (booking as any).pickupDate || booking.startDate || booking.startDateTime
                          const endDate = (booking as any).endTs || (booking as any).dropoff_date || (booking as any).dropoffDate || booking.endDate || booking.endDateTime
                          return (
                            <>
                              {startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                  {new Date(startDate).toLocaleDateString()}
                                </span>
                              )}
                              {startDate && endDate && <span className="text-gray-400">→</span>}
                              {endDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                  {new Date(endDate).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          )
                        })()}
                        {booking.pickupLocation && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="truncate max-w-[140px] sm:max-w-none">{getLocationName(booking.pickupLocation)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Status, Price & Action Buttons */}
                <div className="flex flex-row flex-wrap sm:flex-nowrap items-center sm:items-end gap-2 sm:gap-2.5 lg:flex-col lg:items-end lg:flex-nowrap">
                  {/* Status Badge */}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span>{getStatusText(booking.status)}</span>
                  </div>

                  {/* Price */}
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-blue-900">€{Number(booking.totalPrice || 0).toFixed(0)}</p>
                  </div>

                  {/* View Details + Status action buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto lg:w-full lg:justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedBooking(booking)
                        setIsDetailOpen(true)
                      }}
                      className="min-h-[36px] px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 active:scale-[0.98] flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t.viewDetails || 'Details'}
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, 'confirmed') }}
                          className="min-h-[36px] px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 active:scale-[0.98] flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t.markAsConfirmed || 'Confirm'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, 'cancelled') }}
                          className="min-h-[36px] px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 active:scale-[0.98] flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t.cancel || 'Cancel'}
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (() => {
                      const startAt = new Date((booking as any).startTs || (booking as any).start_date_time || (booking as any).pickup_date || (booking as any).startDate || 0)
                      const pickupDayStart = startOfDay(startAt)
                      const canPickUp = !isNaN(startAt.getTime()) && new Date() >= pickupDayStart
                      if (!canPickUp) return null
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, 'picked_up') }}
                          className="min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] flex items-center gap-1.5"
                        >
                          <CarIcon className="w-3.5 h-3.5" />
                          {t.markAsPickedUp || 'Picked Up'}
                        </button>
                      )
                    })()}
                    {booking.status === 'picked_up' && (() => {
                      const endAt = new Date((booking as any).endTs || (booking as any).end_date_time || (booking as any).dropoff_date || (booking as any).endDate || 0)
                      const returnDayStart = startOfDay(endAt)
                      const canReturn = !isNaN(endAt.getTime()) && new Date() >= returnDayStart
                      if (!canReturn) return null
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, 'returned') }}
                          className="min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-700 active:scale-[0.98] flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t.markAsReturned || 'Returned'}
                        </button>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal - Redesigned */}
      {isDetailOpen && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="relative bg-white rounded-none sm:rounded-3xl shadow-2xl max-w-5xl w-full max-h-screen sm:max-h-[95vh] overflow-hidden flex flex-col animate-scale-fade"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Enhanced Header with Status */}
                <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4 sm:px-6 py-5 sm:py-6 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '32px 32px'
                    }} />
                  </div>
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{t.bookingDetails || 'Booking Details'}</h3>
                          <p className="text-blue-100 text-sm">
                            {selectedBooking.id.startsWith('mock-') 
                              ? `Booking #${selectedBooking.id.split('-')[2]}` 
                              : `#${selectedBooking.id.slice(0, 8).toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      {/* Status Badge in Header */}
                      <div className="mt-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border backdrop-blur-sm ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusIcon(selectedBooking.status)}
                          {getStatusText(selectedBooking.status)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="text-white/90 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content - Redesigned: timeline first, then overview, customer, car, locations */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
                    {/* 1. Status timeline - reflects booking status */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {t.bookingTimeline || 'Booking status'}
                        </h4>
                      </div>
                      <div className="p-4">
                        {selectedBooking.status === 'cancelled' ? (
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                              <XCircle className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{getStatusText('cancelled')}</p>
                              <p className="text-xs text-gray-500">This booking was cancelled</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 sm:gap-4">
                            {(['pending', 'confirmed', 'picked_up', 'returned'] as const).map((step, i) => {
                              const reached = isStatusReached(selectedBooking.status, step)
                              const isCurrent = selectedBooking.status === step
                              const isLast = i === 3
                              return (
                                <div key={step} className="flex flex-1 flex-col items-center min-w-0">
                                  <div className="flex items-center w-full">
                                    {i > 0 && (
                                      <div className={`flex-1 h-0.5 min-w-[8px] ${isStatusReached(selectedBooking.status, (['pending', 'confirmed', 'picked_up', 'returned'] as const)[i - 1]) ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                    )}
                                    <div
                                      className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 ${
                                        isCurrent
                                          ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-200'
                                          : reached
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white border-gray-200 text-gray-400'
                                      }`}
                                    >
                                      {reached ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                                    </div>
                                    {!isLast && (
                                      <div className={`flex-1 h-0.5 min-w-[8px] ${reached ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                    )}
                                  </div>
                                  <p className={`mt-2 text-xs font-medium text-center truncate w-full ${isCurrent ? 'text-blue-600' : reached ? 'text-gray-700' : 'text-gray-400'}`}>
                                    {step === 'pending' && (t.statusPending || 'Pending')}
                                    {step === 'confirmed' && (t.statusConfirmed || 'Confirmed')}
                                    {step === 'picked_up' && (t.statusPickedUp || 'Picked Up')}
                                    {step === 'returned' && (t.statusReturned || 'Returned')}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 2. Overview row: price + dates */}
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t.totalPrice || 'Total'}</p>
                        <p className="text-2xl font-bold text-gray-900">€{Number(selectedBooking.totalPrice || 0).toFixed(2)}</p>
                      </div>
                      {(() => {
                        const startDate = (selectedBooking as any).startTs || (selectedBooking as any).pickup_date || (selectedBooking as any).startDate
                        const endDate = (selectedBooking as any).endTs || (selectedBooking as any).dropoff_date || (selectedBooking as any).endDate
                        return (
                          <>
                            {startDate && (
                              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t.pickupDate || 'Pickup'}</p>
                                <p className="text-base font-semibold text-gray-900">{new Date(startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                            )}
                            {endDate && (
                              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t.returnDate || 'Return'}</p>
                                <p className="text-base font-semibold text-gray-900">{new Date(endDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </section>

                    {/* 3. Customer & Car side by side */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            {t.customerInformation || 'Customer'}
                          </h4>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                              {([selectedBooking.customer?.firstName, selectedBooking.customer?.lastName].filter(Boolean).join(' ') || (selectedBooking.customer as any)?.name || (selectedBooking as any).customerName || '—').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {[selectedBooking.customer?.firstName, selectedBooking.customer?.lastName].filter(Boolean).join(' ') || (selectedBooking.customer as any)?.name || (selectedBooking as any).customerName || '—'}
                              </p>
                              {selectedBooking.customer?.email && (
                                <a href={`mailto:${selectedBooking.customer.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate">
                                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{selectedBooking.customer.email}</span>
                                </a>
                              )}
                              {selectedBooking.customer?.phone && (
                                <a href={`tel:${selectedBooking.customer.phone}`} className="text-sm text-gray-600 hover:underline flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                  {selectedBooking.customer.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <CarIcon className="w-4 h-4 text-gray-500" />
                            {t.carInformation || 'Vehicle'}
                          </h4>
                        </div>
                        <div className="p-4 flex gap-4">
                          {selectedBooking.car?.imageUrl && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={selectedBooking.car.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="min-w-0 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                            <span className="text-gray-500">{t.make || 'Make'}</span>
                            <span className="font-medium text-gray-900">{selectedBooking.car?.make ?? '—'}</span>
                            <span className="text-gray-500">{t.model || 'Model'}</span>
                            <span className="font-medium text-gray-900">{selectedBooking.car?.model ?? '—'}</span>
                            <span className="text-gray-500">{t.year || 'Year'}</span>
                            <span className="font-medium text-gray-900">{selectedBooking.car?.year ?? '—'}</span>
                            {selectedBooking.car?.licensePlate && (
                              <>
                                <span className="text-gray-500">{t.licensePlate || 'Plate'}</span>
                                <span className="font-mono font-medium text-gray-900">{selectedBooking.car.licensePlate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 4. Locations (if any) */}
                    {(selectedBooking.pickupLocation || selectedBooking.dropoffLocation) && (
                      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {t.locations || 'Locations'}
                          </h4>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedBooking.pickupLocation && (
                            <div className="flex gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500">{t.pickupLocation || 'Pickup'}</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{getLocationName(selectedBooking.pickupLocation)}</p>
                              </div>
                            </div>
                          )}
                          {selectedBooking.dropoffLocation && (
                            <div className="flex gap-2">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500">{t.dropoffLocation || 'Dropoff'}</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{getLocationName(selectedBooking.dropoffLocation)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* 5. Status actions - only show at 00:00 of booking date */}
                    {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'returned' && (
                      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Update status</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedBooking.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                                {t.markAsConfirmed || 'Confirm'}
                              </button>
                              <button onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300">
                                {t.cancel || 'Cancel'}
                              </button>
                            </>
                          )}
                          {selectedBooking.status === 'confirmed' && (() => {
                            const startAt = new Date((selectedBooking as any).startTs || (selectedBooking as any).pickup_date || (selectedBooking as any).startDate || 0)
                            const canPickUp = !isNaN(startAt.getTime()) && new Date() >= startOfDay(startAt)
                            if (!canPickUp) return <p className="text-sm text-gray-500">Mark as Picked Up available from {startAt.toLocaleDateString()} (00:00)</p>
                            return (
                              <button onClick={() => handleStatusUpdate(selectedBooking.id, 'picked_up')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                                {t.markAsPickedUp || 'Mark Picked Up'}
                              </button>
                            )
                          })()}
                          {selectedBooking.status === 'picked_up' && (() => {
                            const endAt = new Date((selectedBooking as any).endTs || (selectedBooking as any).dropoff_date || (selectedBooking as any).endDate || 0)
                            const canReturn = !isNaN(endAt.getTime()) && new Date() >= startOfDay(endAt)
                            if (!canReturn) return <p className="text-sm text-gray-500">Mark as Returned available from {endAt.toLocaleDateString()} (00:00)</p>
                            return (
                              <button onClick={() => handleStatusUpdate(selectedBooking.id, 'returned')} className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700">
                                {t.markAsReturned || 'Mark Returned'}
                              </button>
                            )
                          })()}
                        </div>
                      </section>
                    )}
                  </div>
                </div>

                {/* Enhanced Footer with Quick Actions */}
                <div className="bg-white border-t-2 border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="min-h-[44px] px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:bg-gray-200 hover:bg-gray-200 transition-all duration-200 active:scale-95 touch-manipulation"
                    >
                      {t.close || 'Close'}
                    </button>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {(selectedBooking.customer?.email || selectedBooking.customer?.phone) && (
                        <button
                          onClick={() => {
                            setIsContactModalOpen(true)
                          }}
                          className="min-h-[44px] px-6 py-3 bg-slate-500 text-white font-semibold rounded-xl active:bg-slate-600 hover:bg-slate-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span>{t.contactPerson || 'Contact Customer'}</span>
                        </button>
                      )}
                      {(selectedBooking.status === 'returned' || selectedBooking.status === 'picked_up') && (
                        <>
                          <button
                            onClick={() => {
                              setIsDetailOpen(false)
                              setIsFineModalOpen(true)
                            }}
                            className="min-h-[44px] px-6 py-3 bg-amber-500 text-white font-semibold rounded-xl active:bg-amber-600 hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
                          >
                            <Receipt className="w-5 h-5" />
                            <span>{t.reportFine || 'Report Fine'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsDetailOpen(false)
                              setIsClaimModalOpen(true)
                            }}
                            className="min-h-[44px] px-6 py-3 bg-rose-500 text-white font-semibold rounded-xl active:bg-rose-600 hover:bg-rose-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
                          >
                            <AlertTriangle className="w-5 h-5" />
                            <span>{t.fileClaim || 'File Damage Claim'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* File Claim Modal */}
      {isClaimModalOpen && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsClaimModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t.fileDamageClaim || 'File Damage Claim'}</h3>
                      <p className="text-red-100 text-xs sm:text-sm truncate">{[selectedBooking.customer?.firstName, selectedBooking.customer?.lastName].filter(Boolean).join(' ') || (selectedBooking.customer as any)?.name || (selectedBooking as any).customerName || '—'} - {selectedBooking.car?.make} {selectedBooking.car?.model}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsClaimModalOpen(false)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-180px)]">
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700 font-medium">
                      {t.claimWarning || 'Please provide detailed information about the damage to file a claim. This will be recorded and can be used for insurance purposes.'}
                    </p>
                  </div>

                  <form 
                    id="claim-form"
                    className="space-y-5" 
                    onSubmit={(e) => {
                      e.preventDefault()
                      // Handle claim submission
                      showSuccess(t.claimFiled || 'Claim filed successfully!')
                      setIsClaimModalOpen(false)
                      setClaimForm({ description: '', damageType: '', estimatedCost: '', insurance: false })
                      setClaimPhotos([])
                    }}
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.damageDescription || 'Damage Description'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={claimForm.description}
                        onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                        placeholder={t.describeDamage || 'Describe the damage in detail...'}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t.damageType || 'Damage Type'} <span className="text-red-500">*</span>
                        </label>
                        <CustomDropdown
                          value={claimForm.damageType}
                          onChange={(value) => setClaimForm({ ...claimForm, damageType: value })}
                          options={[
                            { value: '', label: t.selectDamageType || 'Select damage type' },
                            { value: 'scratch', label: t.scratch || 'Scratch' },
                            { value: 'dent', label: t.dent || 'Dent' },
                            { value: 'broken', label: t.broken || 'Broken Part' },
                            { value: 'stain', label: t.stain || 'Stain' },
                            { value: 'other', label: t.other || 'Other' },
                          ]}
                          placeholder={t.selectDamageType || 'Select damage type'}
                          required={true}
                          error={!claimForm.damageType}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t.estimatedCost || 'Estimated Repair Cost'} (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={claimForm.estimatedCost}
                          onChange={(e) => setClaimForm({ ...claimForm, estimatedCost: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.uploadPhotos || 'Upload Photos'} (Optional)
                      </label>
                      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors cursor-pointer">
                        <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">{t.clickToUploadPhotos || 'Click to upload photos of the damage'}</p>
                        {claimPhotos.length > 0 && (
                          <p className="text-xs text-green-600 font-medium">{claimPhotos.length} {t.photoSelected || 'photo(s) selected'}</p>
                        )}
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setClaimPhotos(Array.from(e.target.files))
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="insurance" 
                        checked={claimForm.insurance}
                        onChange={(e) => setClaimForm({ ...claimForm, insurance: e.target.checked })}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500" 
                      />
                      <label htmlFor="insurance" className="text-sm text-gray-700">
                        {t.notifyInsurance || 'Notify insurance company about this claim'}
                      </label>
                    </div>

                    {/* Confirmation Statement */}
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mt-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <strong>Confirmation Statement:</strong> I hereby confirm that the information provided in this damage claim form is accurate, complete, and truthful to the best of my knowledge. I understand that providing false or misleading information may result in the rejection of this claim and may have legal consequences. I acknowledge that all photographs and documentation submitted are authentic and accurately represent the condition of the vehicle at the time of return. I agree to cooperate fully with any investigation or assessment of this claim and understand that the final determination of liability and repair costs will be made by the rental agency or insurance company in accordance with the rental agreement terms and conditions.
                      </p>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClaimModalOpen(false)
                      setClaimForm({ description: '', damageType: '', estimatedCost: '', insurance: false })
                      setClaimPhotos([])
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors text-sm sm:text-base"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    form="claim-form"
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {t.submitClaim || 'Submit Claim'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Report Fine Modal */}
      {isFineModalOpen && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
            onClick={() => setIsFineModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden animate-scale-fade"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t.reportFine || 'Report Fine'}</h3>
                      <p className="text-orange-100 text-xs sm:text-sm truncate">{[selectedBooking.customer?.firstName, selectedBooking.customer?.lastName].filter(Boolean).join(' ') || (selectedBooking.customer as any)?.name || (selectedBooking as any).customerName || '—'} - {selectedBooking.car?.make} {selectedBooking.car?.model}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFineModalOpen(false)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-180px)]">
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <p className="text-sm text-orange-700 font-medium">
                      {t.fineWarning || 'Please provide detailed information about the fine received during the rental period. Upload the fine document and provide all necessary details.'}
                    </p>
                  </div>

                  <form 
                    id="fine-form"
                    className="space-y-5" 
                    onSubmit={(e) => {
                      e.preventDefault()
                      
                      // Validate required fields
                      if (!fineForm.details.trim()) {
                        showError(t.fineDetails || 'Fine details are required')
                        return
                      }
                      
                      if (!fineForm.fineType) {
                        showError(t.fineType || 'Fine type is required')
                        return
                      }
                      
                      const finePriceValue = parseFloat(fineForm.finePrice)
                      if (!fineForm.finePrice || !fineForm.finePrice.trim() || isNaN(finePriceValue) || finePriceValue <= 0) {
                        showError(t.finePrice || 'Valid fine amount is required')
                        return
                      }
                      
                      if (finePhotos.length === 0) {
                        showError(t.uploadFineDocument || 'Please upload at least one fine document')
                        return
                      }
                      
                      // Handle fine submission
                      showSuccess(t.fineReported || 'Fine reported successfully!')
                      setIsFineModalOpen(false)
                      setFineForm({ details: '', fineType: '', finePrice: '' })
                      setFinePhotos([])
                    }}
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.fineDetails || 'Fine Details'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={fineForm.details}
                        onChange={(e) => setFineForm({ ...fineForm, details: e.target.value })}
                        placeholder={t.describeFine || 'Describe the fine in detail (location, date, violation type, etc.)...'}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none min-h-[44px] text-base sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t.fineType || 'Fine Type'} <span className="text-red-500">*</span>
                        </label>
                        <CustomDropdown
                          value={fineForm.fineType}
                          onChange={(value) => setFineForm({ ...fineForm, fineType: value })}
                          options={[
                            { value: '', label: t.selectFineType || 'Select fine type' },
                            { value: 'speeding', label: t.speedingFine || 'Speeding' },
                            { value: 'parking', label: t.parkingFine || 'Parking Violation' },
                            { value: 'red_light', label: t.redLightFine || 'Red Light Violation' },
                            { value: 'no_seatbelt', label: t.noSeatbeltFine || 'No Seatbelt' },
                            { value: 'phone', label: t.phoneFine || 'Phone Usage While Driving' },
                            { value: 'other', label: t.other || 'Other' },
                          ]}
                          placeholder={t.selectFineType || 'Select fine type'}
                          required={true}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t.finePrice || 'Fine Amount'} (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={fineForm.finePrice}
                          onChange={(e) => setFineForm({ ...fineForm, finePrice: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all min-h-[44px] text-base sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.uploadFineDocument || 'Upload Fine Document'} <span className="text-red-500">*</span>
                      </label>
                      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                        <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">{t.clickToUploadFine || 'Click to upload fine document/photos'}</p>
                        <p className="text-xs text-gray-500 mb-2">{t.acceptedFormats || 'Accepted: JPG, PNG, PDF (MAX. 10MB each)'}</p>
                        {finePhotos.length > 0 && (
                          <p className="text-xs text-green-600 font-medium">{finePhotos.length} {t.photoSelected || 'photo(s) selected'}</p>
                        )}
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,.pdf" 
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setFinePhotos(Array.from(e.target.files))
                            }
                          }}
                        />
                      </label>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFineModalOpen(false)
                      setFineForm({ details: '', fineType: '', finePrice: '' })
                      setFinePhotos([])
                    }}
                    className="min-h-[44px] px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-200 active:scale-95 touch-manipulation text-sm sm:text-base"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    form="fine-form"
                    className="min-h-[44px] px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 touch-manipulation text-sm sm:text-base"
                  >
                    <Receipt className="w-4 h-4" />
                    {t.submitFine || 'Submit Fine Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contact Person Modal */}
      {isContactModalOpen && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => {
              setIsContactModalOpen(false)
              setContactForm({ subject: '', message: '' })
            }}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                        {t.contactPerson || 'Contact Person'}
                      </h3>
                      <p className="text-blue-100 text-xs sm:text-sm truncate">
                        {[selectedBooking.customer?.firstName, selectedBooking.customer?.lastName].filter(Boolean).join(' ') || (selectedBooking.customer as any)?.name || (selectedBooking as any).customerName || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsContactModalOpen(false)
                      setContactForm({ subject: '', message: '' })
                    }}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-180px)]">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {[selectedBooking.customer?.firstName, selectedBooking.customer?.lastName].filter(Boolean).join(' ') || (selectedBooking.customer as any)?.name || (selectedBooking as any).customerName || '—'}
                        </p>
                        {selectedBooking.customer?.email && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {selectedBooking.customer.email}
                          </p>
                        )}
                        {selectedBooking.customer?.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {selectedBooking.customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <form
                    id="contact-form"
                    className="space-y-5"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setIsSendingMessage(true)
                      
                      // Simulate sending message (replace with actual API call)
                      await new Promise(resolve => setTimeout(resolve, 1000))
                      
                      setSuccessMessage(t.messageSent || 'Message sent successfully!')
                      setIsContactModalOpen(false)
                      setContactForm({ subject: '', message: '' })
                      setIsSendingMessage(false)
                      
                      setTimeout(() => {
                        setSuccessMessage('')
                      }, 3000)
                    }}
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.subject || 'Subject'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder={t.subjectPlaceholder || 'Enter message subject...'}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.message || 'Message'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={8}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder={t.messagePlaceholder || 'Enter your message...'}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsContactModalOpen(false)
                      setContactForm({ subject: '', message: '' })
                    }}
                    disabled={isSendingMessage}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    form="contact-form"
                    disabled={isSendingMessage}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-500 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSendingMessage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.sending || 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t.sendMessage || 'Send Message'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
