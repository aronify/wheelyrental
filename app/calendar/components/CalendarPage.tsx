'use client'

import { useState, useMemo } from 'react'
import { Booking } from '@/types/booking'
import { useLanguage } from '@/contexts/LanguageContext'
import BackButton from '@/app/components/BackButton'
import Breadcrumbs from '@/app/components/Breadcrumbs'

interface CalendarPageProps {
  initialBookings: Booking[]
}

export default function CalendarPage({ initialBookings }: CalendarPageProps) {
  const { t, language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get calendar data
  const { daysInMonth, firstDayOfMonth, today } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return { daysInMonth, firstDayOfMonth, today }
  }, [currentDate])

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return initialBookings.filter((booking) => {
      const bookingStart = new Date(booking.startDateTime)
      const bookingEnd = new Date(booking.endDateTime)
      bookingStart.setHours(0, 0, 0, 0)
      bookingEnd.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      
      return date >= bookingStart && date <= bookingEnd
    })
  }

  // Get pickup events for a date
  const getPickupsForDate = (date: Date) => {
    return initialBookings.filter((booking) => {
      const bookingStart = new Date(booking.startDateTime)
      bookingStart.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      
      return bookingStart.getTime() === date.getTime()
    })
  }

  // Get dropoff events for a date
  const getDropoffsForDate = (date: Date) => {
    return initialBookings.filter((booking) => {
      const bookingEnd = new Date(booking.endDateTime)
      bookingEnd.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      
      return bookingEnd.getTime() === date.getTime()
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(language === 'al' ? 'sq-AL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const monthName = currentDate.toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })

  const dayNames = useMemo(() => {
    const baseDate = new Date(2024, 0, 1) // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(baseDate)
      date.setDate(baseDate.getDate() + i)
      return date.toLocaleDateString(language === 'al' ? 'sq-AL' : 'en-US', { weekday: 'short' })
    })
  }, [language])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []
    
    // Add empty days for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    }
    
    return days
  }, [currentDate, daysInMonth, firstDayOfMonth])

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : []
  const selectedPickups = selectedDate ? getPickupsForDate(selectedDate) : []
  const selectedDropoffs = selectedDate ? getDropoffsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label={t.back} />
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.calendar}</h1>
        <p className="text-gray-600">{t.calendarSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {t.today}
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day, index) => (
                <div key={index} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="aspect-square" />
                }

                const isToday = date.toDateString() === today.toDateString()
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                const pickups = getPickupsForDate(date)
                const dropoffs = getDropoffsForDate(date)
                const hasEvents = pickups.length > 0 || dropoffs.length > 0

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square p-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                        ? 'bg-blue-50 text-blue-900 font-bold border-2 border-blue-600'
                        : hasEvents
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    {hasEvents && !isSelected && (
                      <div className="flex gap-0.5 justify-center mt-1">
                        {pickups.length > 0 && (
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        )}
                        {dropoffs.length > 0 && (
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">{t.pickup}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-600">{t.dropoff}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <span className="text-sm text-gray-600">{t.today}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="space-y-6">
          {selectedDate ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {formatDate(selectedDate)}
              </h3>

              {selectedPickups.length === 0 && selectedDropoffs.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">{t.noEventsToday}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pickups */}
                  {selectedPickups.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {t.upcomingPickups} ({selectedPickups.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedPickups.map((booking) => (
                          <div
                            key={booking.id}
                            className="p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <p className="font-medium text-gray-900 text-sm">{booking.carName}</p>
                            <p className="text-xs text-gray-600 mt-1">{booking.customerName}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(booking.startDateTime)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {booking.pickupLocation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropoffs */}
                  {selectedDropoffs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        {t.upcomingDropoffs} ({selectedDropoffs.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDropoffs.map((booking) => (
                          <div
                            key={booking.id}
                            className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                          >
                            <p className="font-medium text-gray-900 text-sm">{booking.carName}</p>
                            <p className="text-xs text-gray-600 mt-1">{booking.customerName}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(booking.endDateTime)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {booking.dropoffLocation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <svg
                className="w-12 h-12 text-blue-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-blue-900 font-medium">
                Select a date to view events
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t.overview}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t.totalBookings}</span>
                <span className="font-bold text-gray-900">{initialBookings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t.statusConfirmed}</span>
                <span className="font-bold text-gray-900">
                  {initialBookings.filter((b) => b.status === 'confirmed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t.statusPickedUp}</span>
                <span className="font-bold text-gray-900">
                  {initialBookings.filter((b) => b.status === 'picked_up').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


