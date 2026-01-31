import type { NormalizedCustomerBooking } from './customer-bookings-actions'
import type { Booking } from '@/types/booking'

/**
 * Convert normalized customer booking to the shared Booking type for reuse in
 * bookings list UI. Pure transform; safe to call from server or client.
 */
export function normalizedToBooking(n: NormalizedCustomerBooking): Booking {
  const b = n
  return {
    id: b.booking_id,
    companyId: '',
    carId: b.car?.id ?? '',
    customerId: '',
    pickupLocationId: '',
    dropoffLocationId: '',
    startTs: b.booking_dates.start,
    endTs: b.booking_dates.end,
    totalPrice: b.total_price,
    status: b.status,
    notes: b.notes,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    car: b.car
      ? {
          id: b.car.id,
          companyId: '',
          make: b.car.make,
          model: b.car.model,
          year: b.car.year,
          licensePlate: '',
          transmission: b.car.transmission as 'automatic' | 'manual',
          fuelType: b.car.fuel_type as 'petrol' | 'diesel' | 'electric' | 'hybrid',
          seats: 0,
          dailyRate: b.car.daily_rate,
          status: 'active',
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }
      : undefined,
    pickupLocation:
      b.pickup_location && 'id' in b.pickup_location
        ? { id: b.pickup_location.id, name: b.pickup_location.name, city: b.pickup_location.city }
        : b.pickup_location
          ? { id: '', name: b.pickup_location.name, addressLine1: undefined, city: b.pickup_location.city }
          : undefined,
    dropoffLocation:
      b.dropoff_location && 'id' in b.dropoff_location
        ? { id: b.dropoff_location.id, name: b.dropoff_location.name, city: b.dropoff_location.city }
        : b.dropoff_location
          ? { id: '', name: b.dropoff_location.name, addressLine1: undefined, city: b.dropoff_location.city }
          : undefined,
    carName: b.car ? `${b.car.make} ${b.car.model} ${b.car.year}`.trim() : undefined,
  }
}
