/**
 * Booking Types
 * 
 * TypeScript definitions for booking data structures.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled'

import { Car } from './car'
import { Customer } from './customer'

export interface Booking {
  id: string
  bookingReference?: string // 9-digit booking reference
  companyId: string // Required - company that owns the booking
  carId: string // Required
  customerId: string // Required
  pickupLocationId: string // Required - references company_locations
  dropoffLocationId: string // Required - references company_locations
  startTs: Date // start_ts in schema
  endTs: Date // end_ts in schema
  totalPrice: number
  status: BookingStatus // 'pending', 'confirmed', 'picked_up', 'returned', 'cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Joined data
  car?: Car
  customer?: Customer
  pickupLocation?: {
    id: string
    name: string
    addressLine1?: string
    city?: string
  }
  dropoffLocation?: {
    id: string
    name: string
    addressLine1?: string
    city?: string
  }
  // Computed/display fields
  carName?: string
  carPlate?: string
  customerName?: string
  customerPhone?: string
}

/**
 * Helper function to filter bookings by status
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
    const bookingStart = booking.startTs ? new Date(booking.startTs) : null
    const bookingEnd = booking.endTs ? new Date(booking.endTs) : null

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

