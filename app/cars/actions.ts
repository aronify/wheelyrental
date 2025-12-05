'use server'

import { createServerActionClient } from '@/lib/supabaseClient'
import { CarFormData } from '@/types/car'
import { revalidatePath } from 'next/cache'

export interface CarActionResult {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
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

    const { data, error } = await supabase
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
        status: carData.status,
        vin: carData.vin,
        image_url: carData.imageUrl,
        features: carData.features,
      })
      .select()
      .single()

    if (error) {
      return { 
        error: `Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`
      }
    }
    revalidatePath('/cars')
    return { success: true, message: 'Car added successfully', data }
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

