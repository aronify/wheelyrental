/**
 * Car Types
 * 
 * TypeScript definitions for car data structures.
 * These will be replaced with Supabase-generated types when connecting to the database.
 */

export type CarStatus = 'active' | 'maintenance' | 'retired'
export type TransmissionType = 'automatic' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

import { Company } from './company'

export interface Car {
  id: string
  companyId: string // Required - the company that owns this car
  company?: Company // Joined company data
  make: string
  model: string
  year: number
  licensePlate: string
  color?: string
  transmission: TransmissionType
  fuelType: FuelType
  seats: number
  dailyRate: number
  imageUrl?: string
  status: CarStatus // 'active', 'maintenance', 'retired'
  features?: string[]
  depositRequired?: number
  createdAt: Date
  updatedAt: Date
  // Computed fields for client-facing display
  isVerified?: boolean // Derived from company.is_verified === true
  companyName?: string // For display purposes
  // Location arrays (for form compatibility)
  pickupLocations?: string[]
  dropoffLocations?: string[]
}

export interface CarFormData {
  make: string
  model: string
  year: number
  licensePlate: string
  color?: string
  transmission: TransmissionType
  fuelType: FuelType
  seats: number
  dailyRate: number
  imageUrl?: string
  status: CarStatus // 'active', 'maintenance', 'retired'
  features?: string[]
  depositRequired?: number
  // Location IDs from company_locations (if using junction table)
  pickupLocationIds?: string[]
  dropoffLocationIds?: string[]
  // Legacy field names for compatibility
  pickupLocations?: string[]
  dropoffLocations?: string[]
  pickupLocation?: string // Legacy single location field
  dropoffLocation?: string // Legacy single location field
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
      (car.color?.toLowerCase().includes(term) ?? false)
  )
}


