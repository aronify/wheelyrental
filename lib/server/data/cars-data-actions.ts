'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { CarFormData } from '@/types/car'
import { revalidatePath } from 'next/cache'
import { getUserCompanyId } from './company-helpers'

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
export async function addCarAction(carData: CarFormData, companyId?: string): Promise<CarActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated. Please log in again.' }
    }

    // Get user's company_id (from existing cars or parameter)
    let finalCompanyId: string | undefined = companyId
    if (!finalCompanyId) {
      const fetchedCompanyId = await getUserCompanyId(user.id)
      finalCompanyId = fetchedCompanyId || undefined
    }
    
    if (!finalCompanyId) {
      return { error: 'Company ID is required. Please create a company first or provide company_id.' }
    }

    // Insert the car (company_id is required in schema)
    const { data: carDataResult, error: carError } = await supabase
      .from('cars')
      .insert({
        company_id: finalCompanyId, // Required - company that owns the car
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

    // Get user's company IDs for access control
    const { data: userCompanies } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    const companyIds = userCompanies?.map(c => c.company_id) || []
    
    // First, verify the user has access to this car (owner or company member)
    const { data: existingCar } = await supabase
      .from('cars')
      .select('id, owner_id, company_id')
      .eq('id', carId)
      .single()
    
    if (!existingCar) {
      return { error: 'Car not found' }
    }
    
    // Check access: user must be owner OR company member
    const hasAccess = existingCar.owner_id === user.id || 
      (existingCar.company_id && companyIds.includes(existingCar.company_id))
    
    if (!hasAccess) {
      return { error: 'You do not have permission to update this car' }
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
        image_url: carData.imageUrl,
        features: carData.features,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carId)
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

    // Get user's company_id for access control
    const userCompanyId = await getUserCompanyId(user.id)
    
    // First, verify the user has access to this car (must belong to user's company)
    const { data: existingCar } = await supabase
      .from('cars')
      .select('id, company_id')
      .eq('id', carId)
      .single()
    
    if (!existingCar) {
      return { error: 'Car not found' }
    }
    
    // Check access: car must belong to user's company
    if (existingCar.company_id !== userCompanyId) {
      return { error: 'You do not have permission to delete this car' }
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)

    if (error) {
      return { error: 'Failed to delete car' }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car deleted successfully' }
  } catch (error: unknown) {
    return { error: 'An unexpected error occurred' }
  }
}

