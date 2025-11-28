'use client'

import { useState, useMemo } from 'react'
import { Booking, BookingStatus } from '@/types/booking'
import { useLanguage } from '@/contexts/LanguageContext'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { updateBookingStatusAction } from '../actions'
import { Calendar, Clock, User, Car as CarIcon, MapPin, CheckCircle, XCircle, AlertCircle, Search, Filter, FileText, AlertTriangle, Phone, Mail, X, Send, MessageSquare } from 'lucide-react'

interface BookingsPageRedesignedProps {
  initialBookings: Booking[]
}

type ViewFilter = 'all' | 'pending' | 'today' | 'upcoming'

// Mock/Fake bookings for frontend display
const MOCK_BOOKINGS: any[] = [
  {
    id: 'mock-booking-1',
    status: 'pending',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    totalPrice: 450,
    pickupLocation: 'Airport Terminal 1',
    car: {
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      make: 'BMW',
      model: 'X5',
      year: 2023
    },
    customer: {
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma.thompson@example.com',
      phone: '+355 69 123 4567'
    }
  },
  {
    id: 'mock-booking-2',
    status: 'confirmed',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    totalPrice: 320,
    pickupLocation: 'City Center Office',
    car: {
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2024
    },
    customer: {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@example.com',
      phone: '+355 69 234 5678'
    }
  },
  {
    id: 'mock-booking-3',
    status: 'picked_up',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    totalPrice: 280,
    pickupLocation: 'Hotel Grand Plaza',
    car: {
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=400',
      make: 'Audi',
      model: 'A4',
      year: 2023
    },
    customer: {
      firstName: 'Sophia',
      lastName: 'Rodriguez',
      email: 'sophia.rodriguez@example.com',
      phone: '+355 69 345 6789'
    }
  },
  {
    id: 'mock-booking-4',
    status: 'confirmed',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    totalPrice: 540,
    pickupLocation: 'Train Station',
    car: {
      imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=400',
      make: 'Tesla',
      model: 'Model 3',
      year: 2024
    },
    customer: {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@example.com',
      phone: '+355 69 456 7890'
    }
  },
  {
    id: 'mock-booking-5',
    status: 'returned',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    totalPrice: 380,
    pickupLocation: 'Airport Terminal 2',
    car: {
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      make: 'Toyota',
      model: 'Camry',
      year: 2023
    },
    customer: {
      firstName: 'Olivia',
      lastName: 'Martinez',
      email: 'olivia.martinez@example.com',
      phone: '+355 69 567 8901'
    }
  },
  {
    id: 'mock-booking-6',
    status: 'pending',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    totalPrice: 250,
    pickupLocation: 'Downtown Office',
    car: {
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
      make: 'Honda',
      model: 'Civic',
      year: 2023
    },
    customer: {
      firstName: 'Daniel',
      lastName: 'Kim',
      email: 'daniel.kim@example.com',
      phone: '+355 69 678 9012'
    }
  }
]

export default function BookingsPageRedesigned({ initialBookings }: BookingsPageRedesignedProps) {
  const { t } = useLanguage()
  // Combine real bookings with mock bookings
  const allBookings = [...initialBookings, ...MOCK_BOOKINGS]
  const [bookings, setBookings] = useState<any[]>(allBookings)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
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

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = bookings

    // Search filter
    if (searchTerm) {
      result = result.filter((booking) =>
        booking.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        const startDate = new Date((booking as any).pickup_date || (booking as any).startDate || (booking as any).startDateTime)
        return startDate >= today && startDate < tomorrow
      })
    } else if (viewFilter === 'upcoming') {
      result = result.filter((booking) => {
        const startDate = new Date((booking as any).pickup_date || (booking as any).startDate || (booking as any).startDateTime)
        return startDate > now
      })
    }

    return result
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
        const startDate = new Date(b.pickup_date || b.pickupDate || b.startDate || b.startDateTime)
        return startDate >= today && startDate < tomorrow
      }).length,
      upcoming: bookings.filter((b: any) => {
        const startDate = new Date(b.pickup_date || b.pickupDate || b.startDate || b.startDateTime)
        return startDate > now
      }).length,
      revenue: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
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
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'picked_up':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'returned':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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
    <div className="space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
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

        <div className="relative px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{t.bookings || 'Bookings'}</h1>
                  <p className="text-blue-200 text-xs sm:text-sm">{t.bookingsSubtitle || 'Manage all your rental bookings'}</p>
                </div>
              </div>

              {/* Stats Pills - Minimalist */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</span>
                  <span className="text-white/90 text-xs sm:text-sm font-medium">{t.totalBookings || 'Total'}</span>
                </div>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-yellow-500/30 backdrop-blur-sm rounded-full border border-yellow-400/30">
                    <span className="text-xl sm:text-2xl font-bold text-white">{stats.pending}</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{t.statusPending || 'Pending'}</span>
                  </div>
                )}
                {stats.today > 0 && (
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-green-500/30 backdrop-blur-sm rounded-full border border-green-400/30">
                    <span className="text-xl sm:text-2xl font-bold text-white">{stats.today}</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{t.today || 'Today'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs sm:text-sm font-medium">{t.totalRevenue || 'Total Revenue'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">€{stats.revenue.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                viewFilter === 'all'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.all || 'All'}
            </button>
            <button
              onClick={() => setViewFilter('pending')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                viewFilter === 'pending'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                viewFilter === 'today'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {t.today || 'Today'}
              </span>
            </button>
            <button
              onClick={() => setViewFilter('upcoming')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                viewFilter === 'upcoming'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{t.upcomingBookings || 'Upcoming'}</span>
                <span className="sm:hidden">Up</span>
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchByCustomerOrCar || 'Search by customer or car...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white appearance-none text-sm"
              >
                <option value="all">{t.all || 'All'}</option>
                <option value="pending">{t.statusPending || 'Pending'}</option>
                <option value="confirmed">{t.statusConfirmed || 'Confirmed'}</option>
                <option value="picked_up">{t.statusPickedUp || 'Picked Up'}</option>
                <option value="returned">{t.statusReturned || 'Returned'}</option>
                <option value="cancelled">{t.statusCancelled || 'Cancelled'}</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noResults || 'No bookings found'}</h3>
          <p className="text-gray-500">{t.noResults || 'Try adjusting your filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300 relative"
            >

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                {/* Left: Customer & Car Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Car Image */}
                    {booking.car?.imageUrl && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={booking.car.imageUrl}
                          alt={`${booking.car.make} ${booking.car.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Customer */}
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          {booking.customer?.firstName} {booking.customer?.lastName}
                        </span>
                      </div>

                      {/* Car */}
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <CarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-700 truncate">
                          {booking.car?.make} {booking.car?.model} {booking.car?.year}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                          <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                        </div>
                        <span className="hidden sm:inline">→</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                          <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                        </div>
                        {booking.pickupLocation && (
                          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs truncate">{booking.pickupLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-3 lg:flex-col lg:items-end">
                  {/* Status Badge */}
                  <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="hidden sm:inline">{getStatusText(booking.status)}</span>
                    <span className="sm:hidden">{getStatusText(booking.status).charAt(0)}</span>
                  </div>

                  {/* Price */}
                  <div className="text-left sm:text-right ml-auto sm:ml-0">
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">€{booking.totalPrice.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">{t.totalPrice || 'Total'}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto lg:w-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedBooking(booking)
                        setIsDetailOpen(true)
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t.viewDetails || 'View Details'}</span>
                      <span className="sm:hidden">View</span>
                    </button>
                  </div>

                  {/* Quick Actions */}
                  {booking.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto lg:w-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusUpdate(booking.id, 'confirmed')
                        }}
                        className="px-3 sm:px-4 py-2 bg-green-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 justify-center"
                      >
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {t.markAsConfirmed || 'Confirm'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        className="px-3 sm:px-4 py-2 bg-red-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 justify-center"
                      >
                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {t.cancel || 'Cancel'}
                      </button>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'picked_up')}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 justify-center"
                    >
                      <CarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t.markAsPickedUp || 'Mark Picked Up'}</span>
                      <span className="sm:hidden">Picked Up</span>
                    </button>
                  )}

                  {booking.status === 'picked_up' && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'returned')}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-700 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 justify-center"
                    >
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t.markAsReturned || 'Mark Returned'}</span>
                      <span className="sm:hidden">Returned</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {isDetailOpen && selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t.bookingDetails || 'Booking Details'}</h3>
                      <p className="text-blue-100 text-xs sm:text-sm truncate">
                        {selectedBooking.id.startsWith('mock-') 
                          ? `Booking #${selectedBooking.id.split('-')[2]}` 
                          : `#${selectedBooking.id.slice(0, 8).toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-180px)]">
                  {/* Customer Information */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      {t.customerInformation || 'Customer Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.fullName || 'Full Name'}</p>
                        <p className="text-gray-900 font-medium">
                          {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}
                        </p>
                      </div>
                      {selectedBooking.customer?.email && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.email || 'Email'}</p>
                          <p className="text-gray-900 font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {selectedBooking.customer.email}
                          </p>
                        </div>
                      )}
                      {selectedBooking.customer?.phone && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.phone || 'Phone'}</p>
                          <p className="text-gray-900 font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {selectedBooking.customer.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Car Information */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CarIcon className="w-5 h-5 text-green-600" />
                      {t.carInformation || 'Car Information'}
                    </h4>
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                      <div className="flex items-start gap-6">
                        {selectedBooking.car?.imageUrl && (
                          <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-lg">
                            <img
                              src={selectedBooking.car.imageUrl}
                              alt={`${selectedBooking.car.make} ${selectedBooking.car.model}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.make || 'Make'}</p>
                            <p className="text-gray-900 font-semibold text-lg">{selectedBooking.car?.make}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.model || 'Model'}</p>
                            <p className="text-gray-900 font-semibold text-lg">{selectedBooking.car?.model}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.year || 'Year'}</p>
                            <p className="text-gray-900 font-semibold">{selectedBooking.car?.year}</p>
                          </div>
                          {selectedBooking.car?.licensePlate && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.licensePlate || 'License Plate'}</p>
                              <p className="text-gray-900 font-semibold">{selectedBooking.car.licensePlate}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      {t.bookingDetails || 'Booking Details'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.pickupDate || 'Pickup Date'}</p>
                        <p className="text-gray-900 font-medium">{new Date(selectedBooking.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.returnDate || 'Return Date'}</p>
                        <p className="text-gray-900 font-medium">{new Date(selectedBooking.endDate).toLocaleDateString()}</p>
                      </div>
                      {selectedBooking.pickupLocation && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.pickupLocation || 'Pickup Location'}</p>
                          <p className="text-gray-900 font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            {selectedBooking.pickupLocation}
                          </p>
                        </div>
                      )}
                      {selectedBooking.dropoffLocation && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.dropoffLocation || 'Dropoff Location'}</p>
                          <p className="text-gray-900 font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            {selectedBooking.dropoffLocation}
                          </p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.status || 'Status'}</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusIcon(selectedBooking.status)}
                          {getStatusText(selectedBooking.status)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 uppercase mb-1">{t.totalPrice || 'Total Price'}</p>
                        <p className="text-2xl font-bold text-blue-900">€{selectedBooking.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors text-sm sm:text-base"
                  >
                    {t.close || 'Close'}
                  </button>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {(selectedBooking.customer?.email || selectedBooking.customer?.phone) && (
                      <button
                        onClick={() => {
                          setIsContactModalOpen(true)
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.contactPerson || 'Contact Person'}</span>
                        <span className="sm:hidden">Contact</span>
                      </button>
                    )}
                    {(selectedBooking.status === 'returned' || selectedBooking.status === 'picked_up') && (
                      <button
                        onClick={() => {
                          setIsDetailOpen(false)
                          setIsClaimModalOpen(true)
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.fileClaim || 'File Damage Claim'}</span>
                        <span className="sm:hidden">File Claim</span>
                      </button>
                    )}
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
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t.fileDamageClaim || 'File Damage Claim'}</h3>
                      <p className="text-red-100 text-xs sm:text-sm truncate">{selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName} - {selectedBooking.car?.make} {selectedBooking.car?.model}</p>
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
                        <select
                          required
                          value={claimForm.damageType}
                          onChange={(e) => setClaimForm({ ...claimForm, damageType: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white"
                        >
                          <option value="">{t.selectDamageType || 'Select damage type'}</option>
                          <option value="scratch">{t.scratch || 'Scratch'}</option>
                          <option value="dent">{t.dent || 'Dent'}</option>
                          <option value="broken">{t.broken || 'Broken Part'}</option>
                          <option value="stain">{t.stain || 'Stain'}</option>
                          <option value="other">{t.other || 'Other'}</option>
                        </select>
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
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
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
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                        {t.contactPerson || 'Contact Person'}
                      </h3>
                      <p className="text-blue-100 text-xs sm:text-sm truncate">
                        {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}
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
                          {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}
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
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
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
