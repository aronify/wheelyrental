/**
 * Booking Types
 * 
 * TypeScript definitions for booking data structures.
 * These will be replaced with Supabase-generated types when connecting to the database.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled'

import { Car } from './car'
import { Customer } from './customer'

export interface Booking {
  id: string
  carId?: string
  customerId?: string
  pickupDate?: Date
  dropoffDate?: Date
  startDate?: Date
  endDate?: Date
  startDateTime?: Date
  endDateTime?: Date
  carName?: string
  carPlate?: string
  carImageUrl?: string
  dealerName?: string
  customerName?: string
  customerPhone?: string
  pickupLocation?: string
  dropoffLocation?: string
  status: BookingStatus
  totalPrice: number
  createdAt: Date
  updatedAt?: Date
  car?: Car
  customer?: Customer
}

/**
 * Helper function to filter bookings by status
 * TODO: Replace with Supabase query when connecting to database
 */
export function filterBookingsByStatus(
  bookings: Booking[],
  status: BookingStatus | 'all'
): Booking[] {
  if (status === 'all') {
    return bookings
  }
  return bookings.filter((booking) => booking.status === status)
}

/**
 * Helper function to filter bookings by date range
 * TODO: Replace with Supabase query when connecting to database
 */
export function filterBookingsByDateRange(
  bookings: Booking[],
  fromDate: Date | null,
  toDate: Date | null
): Booking[] {
  if (!fromDate && !toDate) {
    return bookings
  }

  return bookings.filter((booking) => {
    const bookingStart = booking.startDateTime ? new Date(booking.startDateTime) : null
    const bookingEnd = booking.endDateTime ? new Date(booking.endDateTime) : null

    if (!bookingStart || !bookingEnd) {
      return false
    }

    if (fromDate && toDate) {
      return bookingStart >= fromDate && bookingEnd <= toDate
    }
    if (fromDate) {
      return bookingStart >= fromDate
    }
    if (toDate) {
      return bookingEnd <= toDate
    }
    return true
  })
}

/**
 * Helper function to search bookings by customer name or car name
 * TODO: Replace with Supabase query when connecting to database
 */
export function searchBookings(
  bookings: Booking[],
  searchTerm: string
): Booking[] {
  if (!searchTerm.trim()) {
    return bookings
  }

  const term = searchTerm.toLowerCase()
  return bookings.filter(
    (booking) =>
      (booking.customerName?.toLowerCase().includes(term) ?? false) ||
      (booking.carName?.toLowerCase().includes(term) ?? false) ||
      (booking.carPlate?.toLowerCase().includes(term) ?? false)
  )
}

