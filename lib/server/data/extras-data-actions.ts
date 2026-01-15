/**
 * Extras Server Actions
 * 
 * Server-side actions for managing car extras (GPS, child seats, insurance, etc.)
 * and car-extras relationships (assigning extras to specific cars with pricing).
 */

'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { withTimeout, withSupabaseTimeout, TIMEOUTS } from '@/lib/utils/timeout'
import { revalidatePath } from 'next/cache'
import type { Extra, CarExtra, ExtraUnit } from '@/types/car'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user's company ID
 */
async function getUserCompanyId(userId: string): Promise<string | null> {
  try {
    const supabase = await createServerActionClient()
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()
    
    return data?.id || null
  } catch (error) {
    console.error('[getUserCompanyId] Error:', error)
    return null
  }
}

// ============================================================================
// EXTRAS CRUD OPERATIONS
// ============================================================================

export interface CreateExtraData {
  name: string
  description?: string
  defaultPrice: number
  unit?: ExtraUnit
  isActive?: boolean
}

export interface UpdateExtraData {
  name?: string
  description?: string
  defaultPrice?: number
  unit?: ExtraUnit
  isActive?: boolean
}

/**
 * Fetch all extras for the current user's company
 */
export async function getExtrasAction(): Promise<{ extras?: Extra[], error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const companyId = await getUserCompanyId(user.id)
    if (!companyId) {
      return { error: 'Company ID not found. Please create a company first.' }
    }

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('extras')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      TIMEOUTS.QUERY,
      'Failed to fetch extras. Please try again.'
    )

    if (error) {
      console.error('[getExtrasAction] Error:', error)
      return { error: error.message || 'Failed to fetch extras' }
    }

    const extras: Extra[] = (data || []).map((extra: any) => ({
      id: extra.id,
      companyId: extra.company_id,
      name: extra.name,
      description: extra.description || undefined,
      defaultPrice: parseFloat(extra.default_price),
      unit: extra.unit as ExtraUnit,
      isActive: extra.is_active,
      createdAt: new Date(extra.created_at),
      updatedAt: new Date(extra.updated_at),
    }))

    return { extras }
  } catch (error) {
    console.error('[getExtrasAction] Error:', error)
    return { error: 'Failed to fetch extras. Please try again.' }
  }
}

/**
 * Create a new extra
 */
export async function createExtraAction(extraData: CreateExtraData): Promise<{ extra?: Extra, error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (!extraData.name?.trim()) {
      return { error: 'Extra name is required' }
    }

    if (extraData.defaultPrice < 0) {
      return { error: 'Price must be positive' }
    }

    const companyId = await getUserCompanyId(user.id)
    if (!companyId) {
      return { error: 'Company ID not found. Please create a company first.' }
    }

    const insertData = {
      company_id: companyId,
      name: extraData.name.trim(),
      description: extraData.description?.trim() || null,
      default_price: extraData.defaultPrice,
      unit: extraData.unit || 'per_day',
      is_active: extraData.isActive !== undefined ? extraData.isActive : true,
    }

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('extras')
        .insert(insertData)
        .select('*')
        .single(),
      TIMEOUTS.INSERT,
      'Failed to create extra. Please try again.'
    )

    if (error) {
      console.error('[createExtraAction] Error:', error)
      
      // Check for duplicate name
      if (error.code === '23505') {
        return { error: 'An extra with this name already exists' }
      }
      
      return { error: error.message || 'Failed to create extra' }
    }

    const extra: Extra = {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      description: data.description || undefined,
      defaultPrice: parseFloat(data.default_price),
      unit: data.unit as ExtraUnit,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }

    revalidatePath('/cars')
    return { extra }
  } catch (error) {
    console.error('[createExtraAction] Error:', error)
    return { error: 'Failed to create extra. Please try again.' }
  }
}

/**
 * Update an existing extra
 */
export async function updateExtraAction(extraId: string, extraData: UpdateExtraData): Promise<{ extra?: Extra, error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (extraData.defaultPrice !== undefined && extraData.defaultPrice < 0) {
      return { error: 'Price must be positive' }
    }

    const updateData: any = {}
    if (extraData.name !== undefined) updateData.name = extraData.name.trim()
    if (extraData.description !== undefined) updateData.description = extraData.description?.trim() || null
    if (extraData.defaultPrice !== undefined) updateData.default_price = extraData.defaultPrice
    if (extraData.unit !== undefined) updateData.unit = extraData.unit
    if (extraData.isActive !== undefined) updateData.is_active = extraData.isActive

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('extras')
        .update(updateData)
        .eq('id', extraId)
        .select('*')
        .single(),
      TIMEOUTS.UPDATE,
      'Failed to update extra. Please try again.'
    )

    if (error) {
      console.error('[updateExtraAction] Error:', error)
      
      // Check for duplicate name
      if (error.code === '23505') {
        return { error: 'An extra with this name already exists' }
      }
      
      return { error: error.message || 'Failed to update extra' }
    }

    const extra: Extra = {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      description: data.description || undefined,
      defaultPrice: parseFloat(data.default_price),
      unit: data.unit as ExtraUnit,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }

    revalidatePath('/cars')
    return { extra }
  } catch (error) {
    console.error('[updateExtraAction] Error:', error)
    return { error: 'Failed to update extra. Please try again.' }
  }
}

/**
 * Delete an extra (soft delete by setting is_active to false)
 */
export async function deleteExtraAction(extraId: string): Promise<{ success?: boolean, error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Soft delete by setting is_active to false
    const { error } = await withSupabaseTimeout(
      supabase
        .from('extras')
        .update({ is_active: false })
        .eq('id', extraId),
      TIMEOUTS.UPDATE,
      'Failed to delete extra. Please try again.'
    )

    if (error) {
      console.error('[deleteExtraAction] Error:', error)
      return { error: error.message || 'Failed to delete extra' }
    }

    revalidatePath('/cars')
    return { success: true }
  } catch (error) {
    console.error('[deleteExtraAction] Error:', error)
    return { error: 'Failed to delete extra. Please try again.' }
  }
}

// ============================================================================
// CAR EXTRAS OPERATIONS
// ============================================================================

export interface CarExtraInput {
  extraId: string
  price: number
  isIncluded: boolean
}

/**
 * Fetch extras for a specific car
 */
export async function getCarExtrasAction(carId: string): Promise<{ carExtras?: CarExtra[], error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('car_extras')
        .select(`
          car_id,
          extra_id,
          price,
          is_included,
          extras:extra_id (
            id,
            company_id,
            name,
            description,
            default_price,
            unit,
            is_active
          )
        `)
        .eq('car_id', carId),
      TIMEOUTS.QUERY,
      'Failed to fetch car extras. Please try again.'
    )

    if (error) {
      console.error('[getCarExtrasAction] Error:', error)
      return { error: error.message || 'Failed to fetch car extras' }
    }

    const carExtras: CarExtra[] = (data || []).map((ce: any) => ({
      carId: ce.car_id,
      extraId: ce.extra_id,
      price: parseFloat(ce.price),
      isIncluded: ce.is_included,
      extra: ce.extras ? {
        id: ce.extras.id,
        companyId: ce.extras.company_id,
        name: ce.extras.name,
        description: ce.extras.description || undefined,
        defaultPrice: parseFloat(ce.extras.default_price),
        unit: ce.extras.unit as ExtraUnit,
        isActive: ce.extras.is_active,
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
    }))

    return { carExtras }
  } catch (error) {
    console.error('[getCarExtrasAction] Error:', error)
    return { error: 'Failed to fetch car extras. Please try again.' }
  }
}

/**
 * Update car extras (replace all extras for a car)
 */
export async function updateCarExtrasAction(
  carId: string,
  extras: CarExtraInput[]
): Promise<{ success?: boolean, error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    console.log('[updateCarExtrasAction] Updating car extras:', { 
      carId, 
      extrasCount: extras.length,
      extras: extras.map(e => ({ extraId: e.extraId, price: e.price, isIncluded: e.isIncluded }))
    })

    // Delete existing car extras
    // First, count existing extras for logging
    const { count: existingCount } = await supabase
      .from('car_extras')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId)

    // Then delete them
    const { error: deleteError } = await supabase
      .from('car_extras')
      .delete()
      .eq('car_id', carId)

    if (deleteError) {
      console.error('[updateCarExtrasAction] Error deleting existing extras:', deleteError)
      return { error: `Failed to clear existing extras: ${deleteError.message}` }
    }
    console.log('[updateCarExtrasAction] Deleted existing extras:', existingCount || 0)

    // Insert new car extras if any
    if (extras.length > 0) {
      const insertData = extras.map(extra => ({
        car_id: carId,
        extra_id: extra.extraId,
        price: extra.price,
        is_included: extra.isIncluded,
      }))

      console.log('[updateCarExtrasAction] Inserting extras:', insertData)

      const { data: insertedData, error: insertError } = await supabase
        .from('car_extras')
        .insert(insertData)
        .select()

      if (insertError) {
        console.error('[updateCarExtrasAction] Error inserting extras:', {
          error: insertError,
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          insertData
        })
        return { error: `Failed to save extras: ${insertError.message}` }
      }

      console.log('[updateCarExtrasAction] ✅ Successfully inserted extras:', {
        count: insertedData?.length || 0,
        inserted: insertedData
      })
    } else {
      console.log('[updateCarExtrasAction] No extras to insert (extras array is empty)')
    }

    console.log('[updateCarExtrasAction] ✅ Car extras updated successfully')
    revalidatePath('/cars')
    return { success: true }
  } catch (error) {
    console.error('[updateCarExtrasAction] Error:', error)
    return { error: 'Failed to update car extras. Please try again.' }
  }
}
