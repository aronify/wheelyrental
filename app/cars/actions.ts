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

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('Add car - Not authenticated')
      return { error: 'Not authenticated. Please log in again.' }
    }

    console.log('Adding car with data:', {
      owner_id: session.user.id,
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
      image_url: carData.imageUrl ? carData.imageUrl.substring(0, 50) + '...' : 'none',
      features: carData.features,
    })

    const { data, error } = await supabase
      .from('cars')
      .insert({
        owner_id: session.user.id,
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
      console.error('Supabase insert error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { 
        error: `Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`
      }
    }

    console.log('Car added successfully:', data)
    revalidatePath('/cars')
    return { success: true, message: 'Car added successfully', data }
  } catch (error: unknown) {
    console.error('Unexpected add car error:', error)
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Update an existing car
 */
export async function updateCarAction(carId: string, carData: CarFormData): Promise<CarActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
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
      .eq('owner_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Update car error:', error)
      return { error: 'Failed to update car' }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car updated successfully', data }
  } catch (error: unknown) {
    console.error('Update car error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a car
 */
export async function deleteCarAction(carId: string): Promise<CarActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)
      .eq('owner_id', session.user.id)

    if (error) {
      console.error('Delete car error:', error)
      return { error: 'Failed to delete car' }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car deleted successfully' }
  } catch (error: unknown) {
    console.error('Delete car error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

