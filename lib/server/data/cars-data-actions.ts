'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { CarFormData } from '@/types/car'
import { revalidatePath } from 'next/cache'

export interface Location {
  id: string
  name: string
  isPickupLocation: boolean
  isDropoffLocation: boolean
}

export interface CreateLocationData {
  name: string
  address?: string
  city?: string
  isPickupLocation: boolean
  isDropoffLocation: boolean
}

export interface CarActionResult {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
}

/**
 * Fetch all active locations from the database for the current user
 * Includes both user's own locations and shared locations (where user_id IS NULL)
 */
export async function getLocationsAction(): Promise<{ locations?: Location[], error?: string }> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Fetch user's own locations and shared locations (user_id IS NULL)
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, is_pickup_location, is_dropoff_location')
      .eq('is_active', true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('is_hq_location', { ascending: false }) // HQ locations first
      .order('user_id', { ascending: true, nullsFirst: false }) // User's locations first, then shared
      .order('name', { ascending: true })

    if (error) {
      return { error: `Failed to fetch locations: ${error.message}` }
    }

    const locations: Location[] = (data || []).map(loc => ({
      id: loc.id,
      name: loc.name,
      isPickupLocation: loc.is_pickup_location,
      isDropoffLocation: loc.is_dropoff_location,
    }))

    return { locations }
  } catch (error: unknown) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Create a new custom location
 */
export async function createLocationAction(locationData: CreateLocationData): Promise<{ location?: Location, error?: string }> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('locations')
      .insert({
        user_id: user.id,
        name: locationData.name.trim(),
        address: locationData.address?.trim() || null,
        city: locationData.city?.trim() || null,
        is_pickup_location: locationData.isPickupLocation,
        is_dropoff_location: locationData.isDropoffLocation,
        is_active: true,
        is_hq_location: false, // Custom locations are not HQ
      })
      .select('id, name, is_pickup_location, is_dropoff_location')
      .single()

    if (error) {
      return { error: `Failed to create location: ${error.message}` }
    }

    const location: Location = {
      id: data.id,
      name: data.name,
      isPickupLocation: data.is_pickup_location,
      isDropoffLocation: data.is_dropoff_location,
    }

    return { location }
  } catch (error: unknown) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Add a new car to the database
 */
export async function addCarAction(carData: CarFormData): Promise<CarActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated. Please log in again.' }
    }

    // Insert the car
    const { data: carDataResult, error: carError } = await supabase
      .from('cars')
      .insert({
        owner_id: user.id,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        license_plate: carData.licensePlate,
        color: carData.color,
        transmission: carData.transmission,
        fuel_type: carData.fuelType,
        seats: carData.seats,
        daily_rate: carData.dailyRate,
        deposit_required: carData.depositRequired || null,
        status: carData.status,
        vin: carData.vin,
        image_url: carData.imageUrl,
        features: carData.features,
      })
      .select()
      .single()

    if (carError) {
      return { 
        error: `Database error: ${carError.message}${carError.hint ? ` (Hint: ${carError.hint})` : ''}`
      }
    }

    const carId = carDataResult.id

    // Insert car locations into junction table
    if (carData.pickupLocations && carData.pickupLocations.length > 0) {
      const pickupLocationEntries = carData.pickupLocations.map(locationId => ({
        car_id: carId,
        location_id: locationId,
        location_type: 'pickup' as const,
      }))

      const { error: pickupError } = await supabase
        .from('car_locations')
        .insert(pickupLocationEntries)

      if (pickupError) {
        console.error('Error inserting pickup locations:', pickupError)
        // Don't fail the entire operation, just log the error
      }
    }

    if (carData.dropoffLocations && carData.dropoffLocations.length > 0) {
      const dropoffLocationEntries = carData.dropoffLocations.map(locationId => ({
        car_id: carId,
        location_id: locationId,
        location_type: 'dropoff' as const,
      }))

      const { error: dropoffError } = await supabase
        .from('car_locations')
        .insert(dropoffLocationEntries)

      if (dropoffError) {
        console.error('Error inserting dropoff locations:', dropoffError)
        // Don't fail the entire operation, just log the error
      }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car added successfully', data: carDataResult }
  } catch (error: unknown) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Update an existing car
 */
export async function updateCarAction(carId: string, carData: CarFormData): Promise<CarActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Update the car
    const { data, error } = await supabase
      .from('cars')
      .update({
        make: carData.make,
        model: carData.model,
        year: carData.year,
        license_plate: carData.licensePlate,
        color: carData.color,
        transmission: carData.transmission,
        fuel_type: carData.fuelType,
        seats: carData.seats,
        daily_rate: carData.dailyRate,
        deposit_required: carData.depositRequired || null,
        status: carData.status,
        vin: carData.vin,
        image_url: carData.imageUrl,
        features: carData.features,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carId)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      return { error: 'Failed to update car' }
    }

    // Delete existing car locations
    const { error: deleteError } = await supabase
      .from('car_locations')
      .delete()
      .eq('car_id', carId)

    if (deleteError) {
      console.error('Error deleting existing car locations:', deleteError)
    }

    // Insert new car locations
    if (carData.pickupLocations && carData.pickupLocations.length > 0) {
      const pickupLocationEntries = carData.pickupLocations.map(locationId => ({
        car_id: carId,
        location_id: locationId,
        location_type: 'pickup' as const,
      }))

      const { error: pickupError } = await supabase
        .from('car_locations')
        .insert(pickupLocationEntries)

      if (pickupError) {
        console.error('Error inserting pickup locations:', pickupError)
      }
    }

    if (carData.dropoffLocations && carData.dropoffLocations.length > 0) {
      const dropoffLocationEntries = carData.dropoffLocations.map(locationId => ({
        car_id: carId,
        location_id: locationId,
        location_type: 'dropoff' as const,
      }))

      const { error: dropoffError } = await supabase
        .from('car_locations')
        .insert(dropoffLocationEntries)

      if (dropoffError) {
        console.error('Error inserting dropoff locations:', dropoffError)
      }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car updated successfully', data }
  } catch (error: unknown) {
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a car
 */
export async function deleteCarAction(carId: string): Promise<CarActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)
      .eq('owner_id', user.id)

    if (error) {
      return { error: 'Failed to delete car' }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car deleted successfully' }
  } catch (error: unknown) {
    return { error: 'An unexpected error occurred' }
  }
}

