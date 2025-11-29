'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Car, 
  User, 
  X,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  List,
  Grid3x3,
  ArrowRight
} from 'lucide-react'

interface Booking {
  id: string
  pickup_date: string
  dropoff_date: string
  total_price: number
  status: string
  pickup_location?: string
  dropoff_location?: string
  car?: {
    id: string
    make: string
    model: string
    year: number
    license_plate?: string
    image_url?: string
    color?: string
  }
  customer?: {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
}

interface CalendarPageProps {
  initialBookings: any[]
}

type ViewMode = 'month' | 'week' | 'day' | 'list'

export default function CalendarPageRedesigned({ initialBookings }: CalendarPageProps) {
  const { t, language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Transform bookings to a consistent format
  const bookings: Booking[] = useMemo(() => {
    return (initialBookings || []).map((b: any) => ({
      id: b.id,
      pickup_date: b.pickup_date || b.pickupDate,
      dropoff_date: b.dropoff_date || b.dropoffDate,
      total_price: b.total_price || b.totalPrice,
      status: b.status,
      pickup_location: b.pickup_location || b.pickupLocation,
      dropoff_location: b.dropoff_location || b.dropoffLocation,
      car: b.car || b.cars,
      customer: b.customer || b.customers,
    }))
  }, [initialBookings])

  const formatDate = (date: Date | string, format: 'full' | 'short' | 'time' | 'month' = 'full') => {
    const d = typeof date === 'string' ? new Date(date) : date
    if (format === 'time') {
      return d.toLocaleTimeString(language === 'al' ? 'sq-AL' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    if (format === 'short') {
      return d.toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
    if (format === 'month') {
      return d.toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
        month: 'long',
        year: 'numeric',
      })
    }
    return d.toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      if (!booking.pickup_date || !booking.dropoff_date) return false
      const pickup = new Date(booking.pickup_date)
      const dropoff = new Date(booking.dropoff_date)
      const checkDate = new Date(date)
      pickup.setHours(0, 0, 0, 0)
      dropoff.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      return checkDate >= pickup && checkDate <= dropoff
    })
  }

  // Get pickups for a date
  const getPickupsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      if (!booking.pickup_date) return false
      const pickup = new Date(booking.pickup_date)
      const checkDate = new Date(date)
      pickup.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      return pickup.getTime() === checkDate.getTime()
    })
  }

  // Get dropoffs for a date
  const getDropoffsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      if (!booking.dropoff_date) return false
      const dropoff = new Date(booking.dropoff_date)
      const checkDate = new Date(date)
      dropoff.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      return dropoff.getTime() === checkDate.getTime()
    })
  }

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    if (viewMode !== 'month') return []
    
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }, [currentDate, viewMode])

  // Week days
  const weekDays = useMemo(() => {
    const baseDate = new Date(2024, 0, 1) // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(baseDate)
      date.setDate(baseDate.getDate() + i)
      return date.toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', { weekday: 'short' })
    })
  }, [language])

  // Today's events
  const todayEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getBookingsForDate(today)
  }, [bookings])

  // Upcoming pickups
  const upcomingPickups = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return bookings
      .filter((b) => {
        if (!b.pickup_date) return false
        const pickup = new Date(b.pickup_date)
        pickup.setHours(0, 0, 0, 0)
        return pickup >= now
      })
      .sort((a, b) => {
        if (!a.pickup_date || !b.pickup_date) return 0
        return new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime()
      })
      .slice(0, 5)
  }, [bookings])

  // Upcoming dropoffs
  const upcomingDropoffs = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return bookings
      .filter((b) => {
        if (!b.dropoff_date) return false
        const dropoff = new Date(b.dropoff_date)
        dropoff.setHours(0, 0, 0, 0)
        return dropoff >= now
      })
      .sort((a, b) => {
        if (!a.dropoff_date || !b.dropoff_date) return 0
        return new Date(a.dropoff_date).getTime() - new Date(b.dropoff_date).getTime()
      })
      .slice(0, 5)
  }, [bookings])

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date())
      setSelectedDate(null)
    } else {
      const newDate = new Date(currentDate)
      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
      } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
      }
      setCurrentDate(newDate)
    }
  }

  const currentPeriodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return formatDate(currentDate, 'month')
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${formatDate(weekStart, 'short')} - ${formatDate(weekEnd, 'short')}`
    } else {
      return formatDate(currentDate)
    }
  }, [currentDate, viewMode, language])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            {t.calendar || 'Calendar'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t.calendarSubtitle || 'View and manage all pickups and dropoffs'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.monthView || 'Month'}</span>
            <span className="sm:hidden">M</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.weekView || 'Week'}</span>
            <span className="sm:hidden">W</span>
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.dayView || 'Day'}</span>
            <span className="sm:hidden">D</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.listView || 'List'}</span>
            <span className="sm:hidden">L</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 capitalize">{currentPeriodLabel}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateDate('today')}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {t.today || 'Today'}
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Month View */}
          {viewMode === 'month' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-1 sm:py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="aspect-square" />
                  }

                  const dateBookings = getBookingsForDate(date)
                  const pickups = getPickupsForDate(date)
                  const dropoffs = getDropoffsForDate(date)
                  const isToday = date.getTime() === today.getTime()
                  const isSelected = selectedDate?.getTime() === date.getTime()

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`aspect-square p-1 sm:p-2 rounded-md sm:rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : isToday
                          ? 'border-blue-300 bg-blue-50/50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {pickups.length > 0 && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                            <span className="text-[10px] sm:text-xs text-green-700 font-medium">{pickups.length}</span>
                          </div>
                        )}
                        {dropoffs.length > 0 && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full" />
                            <span className="text-[10px] sm:text-xs text-orange-700 font-medium">{dropoffs.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Week/Day/List Views */}
          {(viewMode === 'week' || viewMode === 'day' || viewMode === 'list') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {viewMode === 'week' && (t.weekView || 'Week view coming soon')}
                  {viewMode === 'day' && (t.dayView || 'Day view coming soon')}
                  {viewMode === 'list' && (t.listView || 'List view coming soon')}
                </p>
              </div>
            </div>
          )}

          {/* Today's Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {t.todaysEvents || "Today's Events"}
              </h3>
            </div>

            {todayEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t.noEventsToday || 'No events scheduled for today'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((booking) => {
                  const isPickup = booking.pickup_date ? new Date(booking.pickup_date).toDateString() === today.toDateString() : false
                  const isDropoff = booking.dropoff_date ? new Date(booking.dropoff_date).toDateString() === today.toDateString() : false
                  const carName = booking.car ? `${booking.car.make} ${booking.car.model} ${booking.car.year}` : 'Unknown Car'
                  const customerName = booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'Unknown Customer'

                  return (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
                    >
                      {booking.car?.image_url ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={booking.car.image_url}
                            alt={carName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Car className="w-8 h-8 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{carName}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {customerName}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {isPickup && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                              <CheckCircle className="w-3 h-3" />
                              {t.pickup || 'Pickup'}
                            </span>
                          )}
                          {isDropoff && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
                              <AlertCircle className="w-3 h-3" />
                              {t.dropoff || 'Dropoff'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">€{booking.total_price.toFixed(0)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Bookings */}
          {selectedDate && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {formatDate(selectedDate, 'short')}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {getBookingsForDate(selectedDate).map((booking) => {
                  const carName = booking.car ? `${booking.car.make} ${booking.car.model}` : 'Unknown'
                  return (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <p className="font-medium text-sm text-gray-900">{carName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {booking.customer?.first_name} {booking.customer?.last_name}
                      </p>
                    </div>
                  )
                })}
                {getBookingsForDate(selectedDate).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No bookings</p>
                )}
              </div>
            </div>
          )}

          {/* Scheduled Pickups */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-green-900">
                {t.scheduledPickups || 'Scheduled Pickups'}
              </h3>
            </div>
            <div className="space-y-3">
              {upcomingPickups.length === 0 ? (
                <p className="text-sm text-green-700">{t.noEventsScheduled || 'No pickups scheduled'}</p>
              ) : (
                upcomingPickups.map((booking) => {
                  const carName = booking.car ? `${booking.car.make} ${booking.car.model}` : 'Unknown'
                  const customerName = booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'Unknown'
                  return (
                    <div key={booking.id} className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="font-medium text-gray-900 text-sm">{carName}</p>
                      <p className="text-xs text-gray-600 mt-1">{customerName}</p>
                      <p className="text-xs text-green-700 font-medium mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(booking.pickup_date, 'short')}
                      </p>
                      {booking.pickup_location && (
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.pickup_location}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Scheduled Dropoffs */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-orange-900">
                {t.scheduledDropoffs || 'Scheduled Dropoffs'}
              </h3>
            </div>
            <div className="space-y-3">
              {upcomingDropoffs.length === 0 ? (
                <p className="text-sm text-orange-700">{t.noEventsScheduled || 'No dropoffs scheduled'}</p>
              ) : (
                upcomingDropoffs.map((booking) => {
                  const carName = booking.car ? `${booking.car.make} ${booking.car.model}` : 'Unknown'
                  const customerName = booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : 'Unknown'
                  return (
                    <div key={booking.id} className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="font-medium text-gray-900 text-sm">{carName}</p>
                      <p className="text-xs text-gray-600 mt-1">{customerName}</p>
                      <p className="text-xs text-orange-700 font-medium mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(booking.dropoff_date, 'short')}
                      </p>
                      {booking.dropoff_location && (
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.dropoff_location}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {t.bookingDetails || 'Booking Details'}
                  </h3>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-white/80 hover:text-white transition-colors p-2 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(90vh-180px)]">
                  {/* Car Image */}
                  {selectedBooking.car?.image_url ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={selectedBooking.car.image_url}
                        alt={selectedBooking.car.make}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Car className="w-16 h-16 text-blue-600" />
                    </div>
                  )}

                  {/* Car Info */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedBooking.car ? `${selectedBooking.car.make} ${selectedBooking.car.model} ${selectedBooking.car.year}` : 'Unknown Car'}
                    </h4>
                    {selectedBooking.car?.license_plate && (
                      <p className="text-gray-600">{selectedBooking.car.license_plate}</p>
                    )}
                  </div>

                  {/* Customer & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{t.customer || 'Customer'}</p>
                      <p className="text-gray-900 font-medium">
                        {selectedBooking.customer ? `${selectedBooking.customer.first_name} ${selectedBooking.customer.last_name}` : 'Unknown'}
                      </p>
                      {selectedBooking.customer?.phone && (
                        <p className="text-sm text-gray-600 mt-1">{selectedBooking.customer.phone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{t.totalPrice || 'Total Price'}</p>
                      <p className="text-2xl font-bold text-gray-900">€{selectedBooking.total_price.toFixed(0)}</p>
                    </div>
                  </div>

                  {/* Pickup & Dropoff */}
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{t.pickup || 'Pickup'}</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedBooking.pickup_date)}</p>
                        {selectedBooking.pickup_location && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {selectedBooking.pickup_location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{t.dropoff || 'Dropoff'}</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedBooking.dropoff_date)}</p>
                        {selectedBooking.dropoff_location && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {selectedBooking.dropoff_location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    {t.close || 'Close'}
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
