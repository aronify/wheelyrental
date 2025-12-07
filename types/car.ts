/**
 * Car Types
 * 
 * TypeScript definitions for car data structures.
 * These will be replaced with Supabase-generated types when connecting to the database.
 */

export type CarStatus = 'available' | 'rented' | 'maintenance' | 'inactive'
export type TransmissionType = 'automatic' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export interface Car {
  id: string
  ownerId?: string
  make: string
  model: string
  year: number
  licensePlate: string
  color: string
  transmission: TransmissionType
  fuelType: FuelType
  seats: number
  dailyRate: number
  imageUrl: string
  status: CarStatus
  vin?: string
  features: string[]
  pickupLocation?: string
  dropoffLocation?: string
  createdAt: Date
  updatedAt: Date
}

export interface CarFormData {
  make: string
  model: string
  year: number
  licensePlate: string
  color: string
  transmission: TransmissionType
  fuelType: FuelType
  seats: number
  dailyRate: number
  imageUrl: string
  status: CarStatus
  vin?: string
  features: string[]
  pickupLocation?: string
  dropoffLocation?: string
}

/**
 * Helper function to filter cars by status
 */
export function filterCarsByStatus(
  cars: Car[],
  status: CarStatus | 'all'
): Car[] {
  if (status === 'all') {
    return cars
  }
  return cars.filter((car) => car.status === status)
}

/**
 * Helper function to search cars
 */
export function searchCars(cars: Car[], searchTerm: string): Car[] {
  if (!searchTerm.trim()) {
    return cars
  }

  const term = searchTerm.toLowerCase()
  return cars.filter(
    (car) =>
      car.make.toLowerCase().includes(term) ||
      car.model.toLowerCase().includes(term) ||
      car.licensePlate.toLowerCase().includes(term) ||
      car.color.toLowerCase().includes(term)
  )
}


