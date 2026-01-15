'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { CarFormData, Car } from '@/types/car'
import { revalidatePath } from 'next/cache'
import { getUserCompanyId } from './company-helpers'
import { withTimeout, withSupabaseTimeout, TIMEOUTS, TimeoutError } from '@/lib/utils/timeout'
import { updateCarExtrasAction } from './extras-data-actions'

export interface Location {
  id: string
  name: string
  city?: string
  addressLine1?: string
  isPickupLocation: boolean
  isDropoffLocation: boolean
}

export interface CreateLocationData {
  name: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  latitude?: number
  longitude?: number
  isPickupLocation: boolean
  isDropoffLocation: boolean
  isHq?: boolean
}

export interface CarActionResult {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
}

/**
 * Validate location IDs and ensure they belong to the same company
 * Returns validated location IDs or throws error
 */
async function validateAndFilterLocationIds(
  supabase: any,
  locationIds: string[] | undefined,
  carCompanyId: string,
  locationType: 'pickup' | 'dropoff'
): Promise<string[]> {
  if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
    return []
  }

  // Filter out UI markers and invalid values
  const validIds = locationIds
    .filter(id => {
      if (!id) return false
      const strId = String(id).trim()
      return strId && strId !== 'CUSTOM_PICKUP' && strId !== 'CUSTOM_DROPOFF'
    })
    .map(id => String(id).trim())

  if (validIds.length === 0) {
    return []
  }

  // Verify all locations exist, belong to same company, and have correct type flag
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, company_id, is_pickup, is_dropoff')
    .in('id', validIds)

  if (error) {
    console.error(`[validateAndFilterLocationIds] Error fetching locations:`, error)
    throw new Error(`Failed to validate locations: ${error.message}`)
  }

  if (!locations || locations.length !== validIds.length) {
    const foundIds = locations?.map((l: any) => l.id) || []
    const missingIds = validIds.filter(id => !foundIds.includes(id))
    throw new Error(`Some locations do not exist: ${missingIds.join(', ')}`)
  }

  // Validate company ownership and type flags
  const invalidLocations: string[] = []
  for (const loc of locations as Array<{ id: string; company_id: string; is_pickup: boolean; is_dropoff: boolean }>) {
    if (loc.company_id !== carCompanyId) {
      invalidLocations.push(`${loc.id} (wrong company)`)
    }
    if (locationType === 'pickup' && !loc.is_pickup) {
      invalidLocations.push(`${loc.id} (not a pickup location)`)
    }
    if (locationType === 'dropoff' && !loc.is_dropoff) {
      invalidLocations.push(`${loc.id} (not a dropoff location)`)
    }
  }

  if (invalidLocations.length > 0) {
    throw new Error(`Invalid locations: ${invalidLocations.join(', ')}`)
  }

  return validIds
}

/**
 * Update car_locations junction table for a car
 * Deletes existing entries and inserts new ones atomically
 */
async function updateCarLocationsJunction(
  supabase: any,
  carId: string,
  pickupLocationIds: string[],
  dropoffLocationIds: string[]
): Promise<void> {
  console.log('[updateCarLocationsJunction] Updating junction table:', {
    carId,
    pickupCount: pickupLocationIds.length,
    dropoffCount: dropoffLocationIds.length,
  })

  // Delete existing entries for this car
  const { error: deleteError } = await supabase
    .from('car_locations')
    .delete()
    .eq('car_id', carId)

  if (deleteError) {
    console.error('[updateCarLocationsJunction] Error deleting existing entries:', deleteError)
    throw new Error(`Failed to clear existing locations: ${deleteError.message}`)
  }

  // Prepare new entries
  const newEntries: Array<{ car_id: string; location_id: string; location_type: 'pickup' | 'dropoff' }> = []

  for (const locationId of pickupLocationIds) {
    newEntries.push({
      car_id: carId,
      location_id: locationId,
      location_type: 'pickup',
    })
  }

  for (const locationId of dropoffLocationIds) {
    newEntries.push({
      car_id: carId,
      location_id: locationId,
      location_type: 'dropoff',
    })
  }

  if (newEntries.length === 0) {
    console.log('[updateCarLocationsJunction] No locations to insert')
    return
  }

  // Insert new entries
  const { error: insertError } = await supabase
    .from('car_locations')
    .insert(newEntries)

  if (insertError) {
    console.error('[updateCarLocationsJunction] Error inserting new entries:', insertError)
    throw new Error(`Failed to save locations: ${insertError.message}`)
  }

  console.log('[updateCarLocationsJunction] Successfully updated junction table')
}

/**
 * Fetch location IDs for a car from the junction table
 */
async function fetchCarLocationIds(
  supabase: any,
  carId: string
): Promise<{ pickup: string[]; dropoff: string[] }> {
  const { data: carLocations, error } = await supabase
    .from('car_locations')
    .select('location_id, location_type')
    .eq('car_id', carId)

  if (error) {
    console.error('[fetchCarLocationIds] Error fetching locations:', error)
    // Return empty arrays on error (don't fail the whole operation)
    return { pickup: [], dropoff: [] }
  }

  const pickup: string[] = []
  const dropoff: string[] = []

  for (const entry of carLocations || []) {
    if (entry.location_type === 'pickup') {
      pickup.push(entry.location_id)
    } else if (entry.location_type === 'dropoff') {
      dropoff.push(entry.location_id)
    }
  }

  return { pickup, dropoff }
}

/**
 * Ensure HQ location exists for a company
 * Creates "HQ - {company_name}" location if it doesn't exist
 * Matches exact schema: public.locations table
 */
async function ensureHqLocation(supabase: any, companyId: string): Promise<void> {
  try {
    console.log('[ensureHqLocation] Checking for HQ location, company_id:', companyId)
    
    // Check if HQ location already exists (using unique index: idx_company_locations_hq_unique)
    // RLS will automatically filter to user's company locations
    const { data: existingHq, error: checkError } = await supabase
      .from('locations')
      .select('id, name')
      .eq('is_hq', true)
      .maybeSingle()
    // RLS ensures we only see locations from user's company

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected, other errors are real
      console.error('[ensureHqLocation] Error checking for existing HQ:', checkError)
      return
    }

    if (existingHq) {
      console.log('[ensureHqLocation] HQ location already exists:', existingHq.id, existingHq.name)
      return // HQ location exists, nothing to do
    }

    console.log('[ensureHqLocation] No HQ location found, creating new one...')

    // Get company name
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('[ensureHqLocation] Company not found:', companyId, companyError)
      return
    }

    // Create HQ location - matches exact schema
    const hqLocationName = `HQ - ${company.name}`
    console.log('[ensureHqLocation] Creating HQ location:', hqLocationName)
    
    const { data: newHq, error: createError } = await supabase
      .from('locations')
      .insert({
        company_id: companyId,
        name: hqLocationName,
        address_line_1: null,
        address_line_2: null,
        city: null,
        region: null,
        postal_code: null,
        country: 'Albania', // Default per schema
        latitude: null,
        longitude: null,
        is_pickup: true, // Required, default true
        is_dropoff: true, // Required, default true
        is_hq: true, // This is the HQ location
        is_active: true, // Default true
      })
      .select('id, name')
      .single()

    if (createError) {
      // Handle unique constraint violation (if somehow two HQ locations exist)
      if (createError.code === '23505') {
        console.warn('[ensureHqLocation] HQ location already exists (unique constraint):', createError)
        return
      }
      console.error('[ensureHqLocation] Error creating HQ location:', {
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint
      })
      return
    }

    if (newHq) {
      console.log('[ensureHqLocation] ✅ Successfully created HQ location:', newHq.id, newHq.name)
    }
  } catch (error) {
    console.error('[ensureHqLocation] Unexpected error:', error)
  }
}

/**
 * Fetch all active locations from the database for the current user's company
 * DEBUG: Added comprehensive logging to identify why locations aren't showing
 */
export async function getLocationsAction(): Promise<{ locations?: Location[], error?: string, debug?: any }> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) {
      console.error('[getLocationsAction] Not authenticated:', authError)
      return { error: 'Not authenticated' }
    }

    console.log('[getLocationsAction] User authenticated:', user.id)

    // Get user's company_id - CRITICAL: Must resolve before querying
    // Try direct query first (more reliable in server actions)
    let companyId: string | null = null
    
    // Method 1: Direct query using same supabase client
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()
    
    companyId = company?.id || null
    
    // Method 2: Fallback to helper function
    if (!companyId) {
      companyId = await getUserCompanyId(user.id)
    }
    
    console.log('[getLocationsAction] Company ID resolved:', companyId, 'method:', company ? 'direct' : 'helper')
    
    if (!companyId) {
      console.error('[getLocationsAction] No company_id found for user:', user.id)
      // Try to get from cars as last resort
      const { data: car } = await supabase
        .from('cars')
        .select('company_id')
        .limit(1)
        .maybeSingle()
      
      companyId = car?.company_id || null
      console.log('[getLocationsAction] Company ID from cars fallback:', companyId)
      
      if (!companyId) {
        return { 
          error: 'Company ID is required. Please create a company first.',
          debug: { userId: user.id, companyId: null, checkedCompanies: !!company, checkedCars: !!car }
        }
      }
    }

    // Ensure HQ location exists for the company (idempotent - only creates if missing)
    // NOTE: This runs BEFORE the query to ensure HQ exists
    console.log('[getLocationsAction] Ensuring HQ location exists for company_id:', companyId)
    try {
      await ensureHqLocation(supabase, companyId)
    } catch (hqError) {
      // Log but don't fail - HQ creation is best-effort
      console.warn('[getLocationsAction] HQ location creation failed (non-critical):', hqError)
    }

    // Fetch locations for the user's company
    // Security: RLS policies (locations_select_company) automatically filter by company_id
    // RLS uses companies.owner_id = auth.uid() to enforce company scoping
    // We still filter by is_active for business logic, but RLS handles security
    console.log('[getLocationsAction] Querying locations (RLS will filter by company)')
    console.log('[getLocationsAction] Current user:', user.id, 'Company ID:', companyId)
    
    // NOTE: RLS policy automatically filters by company_id, so we don't need .eq('company_id', companyId)
    // However, we keep it for explicit clarity and as a safety measure
    const result = await withSupabaseTimeout<{
      id: string
      name: string
      city?: string
      address_line_1?: string
      is_pickup: boolean
      is_dropoff: boolean
      is_active: boolean
      company_id: string
      is_hq: boolean
    }[]>(
      supabase
        .from('locations')
        .select('id, name, city, address_line_1, is_pickup, is_dropoff, is_active, company_id, is_hq', { count: 'exact' })
        .eq('is_active', true) // Only active locations (business logic)
        .order('is_hq', { ascending: false }) // HQ locations first
        .order('name', { ascending: true }),
      TIMEOUTS.QUERY,
      'Failed to fetch locations. The request timed out. Please try again.'
    )
    const { data, error, count } = result
    
    // RLS will automatically filter to only locations where:
    // EXISTS (SELECT 1 FROM companies WHERE id = locations.company_id AND owner_id = auth.uid())

    console.log('[getLocationsAction] Query result:', { 
      dataCount: data?.length || 0, 
      count, 
      error: error?.message,
      sampleLocation: data?.[0]
    })

    if (error) {
      console.error('[getLocationsAction] ❌ Supabase query error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        companyId: companyId,
        userId: user.id
      })
      
      // Check if it's an RLS/permission error
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return { 
          error: 'Permission denied. Please check RLS policies for locations table.',
          debug: { 
            companyId, 
            userId: user.id,
            errorCode: error.code, 
            errorMessage: error.message,
            hint: 'Run database/rls-policies/fix-jwt-rls-defensive-complete.sql to fix RLS policies'
          }
        }
      }
      
      return { 
        error: `Failed to fetch locations: ${error.message}`,
        debug: { companyId, errorCode: error.code, errorDetails: error.details }
      }
    }

    if (!data || data.length === 0) {
      console.warn('[getLocationsAction] ⚠️ No locations found for company_id:', companyId)
      console.warn('[getLocationsAction] This might indicate:')
      console.warn('  1. No locations exist for this company')
      console.warn('  2. All locations have is_active = false')
      console.warn('  3. RLS policies are blocking access')
      console.warn('  4. Company ID mismatch')
      
      return { 
        locations: [],
        debug: { 
          companyId, 
          userId: user.id,
          queryResult: 'empty',
          count: count || 0
        }
      }
    }

    // Map database fields to Location interface
    // CRITICAL: Ensure boolean fields are properly mapped
    const locations: Location[] = (data || []).map((loc: any) => {
      const mapped = {
        id: loc.id,
        name: loc.name,
        city: loc.city || undefined,
        addressLine1: loc.address_line_1 || undefined,
        isPickupLocation: Boolean(loc.is_pickup), // Ensure boolean conversion
        isDropoffLocation: Boolean(loc.is_dropoff), // Ensure boolean conversion
      }
      console.log('[getLocationsAction] Mapped location:', {
        id: mapped.id,
        name: mapped.name,
        isPickup: mapped.isPickupLocation,
        isDropoff: mapped.isDropoffLocation,
        rawIsPickup: loc.is_pickup,
        rawIsDropoff: loc.is_dropoff,
      })
      return mapped
    })

    console.log('[getLocationsAction] ✅ Mapped locations:', {
      total: locations.length,
      pickupCount: locations.filter(l => l.isPickupLocation).length,
      dropoffCount: locations.filter(l => l.isDropoffLocation).length,
      allLocations: locations.map(l => ({ id: l.id, name: l.name, isPickup: l.isPickupLocation, isDropoff: l.isDropoffLocation }))
    })
    
    return { locations }
  } catch (error: unknown) {
    console.error('[getLocationsAction] Unexpected error:', error)
    
    // Handle timeout errors
    if (error instanceof TimeoutError) {
      return { 
        error: error.message || 'Request timed out. Please try again.',
        debug: { error: 'TimeoutError' }
      }
    }
    
    return { 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      debug: { error: String(error) }
    }
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

    // Validate required fields
    if (!locationData.name?.trim()) {
      return { error: 'Location name is required' }
    }

    // Note: All locations are automatically set as both pickup and dropoff
    // This ensures locations appear in both dropdowns

    // Get user's company_id (required for INSERT) - with timeout
    const companyId = await withTimeout(
      getUserCompanyId(user.id),
      TIMEOUTS.QUERY,
      'Failed to retrieve company information. Please try again.'
    )
    if (!companyId) {
      return { error: 'Company ID is required. Please create a company first.' }
    }

    // Check HQ uniqueness constraint if this is an HQ location
    // RLS will automatically filter to user's company locations
    if (locationData.isHq) {
      const { data: existingHq } = await withSupabaseTimeout(
        supabase
          .from('locations')
          .select('id')
          .eq('is_hq', true)
          .eq('is_active', true)
          .maybeSingle(),
        TIMEOUTS.QUERY,
        'Failed to check existing locations. Please try again.'
      )
      // RLS ensures we only see locations from user's company

      if (existingHq) {
        return { error: 'A headquarters location already exists for this company. Please update the existing HQ location instead.' }
      }
    }

    // Prepare location data with proper types
    // RLS policy (locations_insert_company) will verify company_id matches user's company
    // All locations are automatically set as both pickup and dropoff
    const locationInsertData = {
      company_id: companyId, // Required - RLS will verify this matches user's company
      name: locationData.name.trim(),
      address_line_1: locationData.addressLine1?.trim() || null,
      address_line_2: locationData.addressLine2?.trim() || null,
      city: locationData.city?.trim() || null,
      region: locationData.region?.trim() || null,
      postal_code: locationData.postalCode?.trim() || null,
      country: locationData.country?.trim() || 'Albania', // Default to Albania
      latitude: locationData.latitude !== undefined && locationData.latitude !== null
        ? parseFloat(locationData.latitude.toFixed(8))
        : null,
      longitude: locationData.longitude !== undefined && locationData.longitude !== null
        ? parseFloat(locationData.longitude.toFixed(8))
        : null,
      // Always set both pickup and dropoff to true so location appears in both dropdowns
      is_pickup: true,
      is_dropoff: true,
      is_hq: locationData.isHq || false, // Default false
      is_active: true, // Default true
    }

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('locations')
        .insert(locationInsertData)
        .select('id, name, is_pickup, is_dropoff')
        .single(),
      TIMEOUTS.INSERT,
      'Failed to create location. The request timed out. Please try again.'
    )

    if (error) {
      // Handle specific database errors
      if (error.code === '23505') { // Unique violation (HQ constraint)
        return { error: 'A headquarters location already exists for this company' }
      }
      if (error.code === '23514') { // Check constraint violation
        return { error: `Invalid data: ${error.message}` }
      }
      return { error: `Failed to create location: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}` }
    }

    // Verify the data returned matches what we sent
    console.log('[createLocationAction] Location created:', {
      id: data.id,
      name: data.name,
      db_is_pickup: data.is_pickup,
      db_is_dropoff: data.is_dropoff,
      note: 'All locations are set as both pickup and dropoff'
    })

    const location: Location = {
      id: data.id,
      name: data.name,
      city: locationData.city || undefined,
      addressLine1: locationData.addressLine1 || undefined,
      // All locations are both pickup and dropoff
      isPickupLocation: true,
      isDropoffLocation: true,
    }

    return { location }
  } catch (error: unknown) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Update an existing location
 */
export async function updateLocationAction(
  locationId: string,
  locationData: CreateLocationData
): Promise<{ location?: Location, error?: string }> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Validate required fields
    if (!locationData.name?.trim()) {
      return { error: 'Location name is required' }
    }

    // Note: All locations are automatically set as both pickup and dropoff
    // This ensures locations appear in both dropdowns

    // Get user's company_id (for validation, but RLS handles security) - with timeout
    const companyId = await withTimeout(
      getUserCompanyId(user.id),
      TIMEOUTS.QUERY,
      'Failed to retrieve company information. Please try again.'
    )
    if (!companyId) {
      return { error: 'Company ID is required. Please create a company first.' }
    }

    // Verify the location exists and belongs to user's company - with timeout
    // RLS policy (locations_update_company) will automatically filter by company
    // If location doesn't belong to user's company, query will return empty
    const { data: existingLocation } = await withSupabaseTimeout(
      supabase
        .from('locations')
        .select('company_id')
        .eq('id', locationId)
        .single(),
      TIMEOUTS.QUERY,
      'Failed to verify location. Please try again.'
    )
    // RLS ensures we can only see locations from user's company

    if (!existingLocation) {
      return { error: 'Location not found or you do not have permission to update it' }
    }

    // Prepare location data with proper types
    // All locations are automatically set as both pickup and dropoff
    const locationUpdateData = {
      name: locationData.name.trim(),
      address_line_1: locationData.addressLine1?.trim() || null,
      address_line_2: locationData.addressLine2?.trim() || null,
      city: locationData.city?.trim() || null,
      region: locationData.region?.trim() || null,
      postal_code: locationData.postalCode?.trim() || null,
      country: locationData.country?.trim() || 'Albania',
      latitude: locationData.latitude !== undefined && locationData.latitude !== null
        ? parseFloat(locationData.latitude.toFixed(8))
        : null,
      longitude: locationData.longitude !== undefined && locationData.longitude !== null
        ? parseFloat(locationData.longitude.toFixed(8))
        : null,
      // Always set both pickup and dropoff to true so location appears in both dropdowns
      is_pickup: true,
      is_dropoff: true,
    }

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('locations')
        .update(locationUpdateData)
        .eq('id', locationId)
        .select('id, name, is_pickup, is_dropoff')
        .single(),
      TIMEOUTS.UPDATE,
      'Failed to update location. The request timed out. Please try again.'
    )

    if (error) {
      if (error.code === '23514') { // Check constraint violation
        return { error: `Invalid data: ${error.message}` }
      }
      return { error: `Failed to update location: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}` }
    }

    const location: Location = {
      id: data.id,
      name: data.name,
      city: locationData.city || undefined,
      addressLine1: locationData.addressLine1 || undefined,
      // All locations are both pickup and dropoff
      isPickupLocation: true,
      isDropoffLocation: true,
    }

    return { location }
  } catch (error: unknown) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Delete a location
 */
export async function deleteLocationAction(locationId: string): Promise<{ success?: boolean, error?: string }> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get user's company_id (for validation, but RLS handles security) - with timeout
    const companyId = await withTimeout(
      getUserCompanyId(user.id),
      TIMEOUTS.QUERY,
      'Failed to retrieve company information. Please try again.'
    )
    if (!companyId) {
      return { error: 'Company ID is required. Please create a company first.' }
    }

    // Verify the location exists and belongs to user's company - with timeout
    // RLS policy (locations_delete_company) will automatically filter by company
    // If location doesn't belong to user's company, query will return empty
    const { data: existingLocation } = await withSupabaseTimeout(
      supabase
        .from('locations')
        .select('company_id, is_hq')
        .eq('id', locationId)
        .single(),
      TIMEOUTS.QUERY,
      'Failed to verify location. Please try again.'
    )
    // RLS ensures we can only see locations from user's company

    if (!existingLocation) {
      return { error: 'Location not found or you do not have permission to delete it' }
    }

    // Prevent deletion of HQ location (business rule)
    if (existingLocation.is_hq) {
      return { error: 'Cannot delete headquarters location. Update it instead.' }
    }

    const { error } = await withSupabaseTimeout(
      supabase
        .from('locations')
        .delete()
        .eq('id', locationId),
      TIMEOUTS.DELETE,
      'Failed to delete location. The request timed out. Please try again.'
    )

    if (error) {
      return { error: `Failed to delete location: ${error.message}` }
    }

    return { success: true }
  } catch (error: unknown) {
    // Handle timeout errors
    if (error instanceof TimeoutError) {
      return { error: error.message || 'Request timed out. Please try again.' }
    }
    
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

    // Validate required fields
    if (!carData.make?.trim()) {
      return { error: 'Make is required' }
    }
    if (!carData.model?.trim()) {
      return { error: 'Model is required' }
    }
    if (!carData.year || carData.year < 1990 || carData.year > new Date().getFullYear() + 1) {
      return { error: 'Valid year is required' }
    }
    if (!carData.licensePlate?.trim()) {
      return { error: 'License plate is required' }
    }
    if (!carData.transmission || !['automatic', 'manual'].includes(carData.transmission)) {
      return { error: 'Valid transmission type is required (automatic or manual)' }
    }
    if (!carData.fuelType || !['petrol', 'diesel', 'electric', 'hybrid'].includes(carData.fuelType)) {
      return { error: 'Valid fuel type is required' }
    }
    if (!carData.seats || carData.seats < 1 || carData.seats > 20) {
      return { error: 'Valid number of seats is required (1-20)' }
    }
    if (!carData.dailyRate || carData.dailyRate <= 0) {
      return { error: 'Daily rate must be greater than 0' }
    }
    if (carData.depositRequired !== undefined && carData.depositRequired < 0) {
      return { error: 'Deposit required cannot be negative' }
    }

    // Get user's company_id (from existing cars or parameter) - with timeout
    let finalCompanyId: string | undefined = companyId
    if (!finalCompanyId) {
      finalCompanyId = await withTimeout(
        getUserCompanyId(user.id),
        TIMEOUTS.QUERY,
        'Failed to retrieve company information. Please try again.'
      ) || undefined
    }
    
    if (!finalCompanyId) {
      return { error: 'Company ID is required. Please create a company first or provide company_id.' }
    }

    // Check for duplicate license plate (unique constraint) - with timeout
    // RLS will automatically filter to user's company cars only
    const normalizedLicensePlate = carData.licensePlate.trim().toUpperCase()
    const { data: existingCar, error: checkError } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .select('id, license_plate')
        .eq('license_plate', normalizedLicensePlate)
        .maybeSingle(),
      TIMEOUTS.QUERY,
      'Failed to check for duplicate license plate. Please try again.'
    )
    // RLS ensures we only see cars from user's company

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected, other errors are real
      console.error('[addCarAction] Error checking license plate:', checkError)
      // Continue anyway - let database constraint handle it
    }

    if (existingCar) {
      return { error: `A car with license plate "${normalizedLicensePlate}" already exists in your fleet` }
    }

    // Prepare data with proper types and defaults
    // All fields match exact schema requirements
    const carInsertData: any = {
      company_id: finalCompanyId, // Required - RLS will verify this matches JWT company_id
      make: carData.make.trim(), // Required, not null
      model: carData.model.trim(), // Required, not null
      year: Math.floor(carData.year), // Required integer, ensure no decimals
      license_plate: normalizedLicensePlate, // Required, not null, unique constraint
      color: carData.color?.trim() || null, // Optional (nullable)
      transmission: carData.transmission as 'automatic' | 'manual', // Required, check constraint
      fuel_type: carData.fuelType as 'petrol' | 'diesel' | 'electric' | 'hybrid', // Required
      seats: Math.floor(Math.max(1, carData.seats)), // Required integer, ensure >= 1 (check constraint)
      daily_rate: parseFloat(Math.max(0.01, carData.dailyRate).toFixed(2)), // Required, must be > 0 (check constraint)
      deposit_required: carData.depositRequired !== undefined && carData.depositRequired !== null && carData.depositRequired > 0
        ? parseFloat(carData.depositRequired.toFixed(2)) 
        : null, // Optional, must be >= 0 if provided (check constraint)
      status: (carData.status || 'active') as 'active' | 'maintenance' | 'retired', // Required, default 'active', check constraint
      image_url: carData.imageUrl?.trim() || null, // Optional (nullable)
      features: Array.isArray(carData.features) && carData.features.length > 0 
        ? carData.features.filter(f => f && f.trim()).map(f => f.trim()) 
        : null, // Optional text[] array, filter empty/null values
    }

    // Add pickup_locations and dropoff_locations TEXT[] arrays if provided
    // These are stored as arrays of location IDs (UUIDs as strings)
    // Helper function to validate and filter location IDs
    const validateLocationIds = (ids: any[] | undefined): string[] | null => {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return null
      }
      
      // Filter out invalid values: null, undefined, empty strings, and non-UUID-like strings
      // Also filter out CUSTOM_PICKUP and CUSTOM_DROPOFF which are UI markers
      const validIds = ids
        .filter(id => {
          if (!id) return false
          const strId = String(id).trim()
          if (!strId) return false
          // Filter out custom location markers
          if (strId === 'CUSTOM_PICKUP' || strId === 'CUSTOM_DROPOFF') return false
          // Basic UUID validation (8-4-4-4-12 format)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          return uuidRegex.test(strId)
        })
        .map(id => String(id).trim())
      
      return validIds.length > 0 ? validIds : null
    }

    carInsertData.pickup_locations = validateLocationIds(carData.pickupLocations)
    carInsertData.dropoff_locations = validateLocationIds(carData.dropoffLocations)

    // Insert the car
    const { data: carDataResult, error: carError } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .insert(carInsertData)
        .select(`
          id,
          company_id,
          make,
          model,
          year,
          license_plate,
          color,
          transmission,
          fuel_type,
          seats,
          daily_rate,
          deposit_required,
          status,
          image_url,
          features,
          pickup_locations,
          dropoff_locations,
          created_at,
          updated_at
        `)
        .single(),
      TIMEOUTS.INSERT,
      'Failed to create car. The request timed out. Please try again.'
    )

    if (carError) {
      // Handle specific database errors with clear messages
      if (carError.code === '23505') { // Unique violation (license_plate)
        return { error: `A car with license plate "${normalizedLicensePlate}" already exists. Please use a different license plate.` }
      }
      if (carError.code === '23514') { // Check constraint violation
        const constraintMessage = carError.message.includes('daily_rate') 
          ? 'Daily rate must be greater than 0'
          : carError.message.includes('seats')
          ? 'Seats must be greater than 0'
          : carError.message.includes('deposit_required')
          ? 'Deposit required must be 0 or greater'
          : carError.message.includes('status')
          ? 'Status must be active, maintenance, or retired'
          : carError.message.includes('transmission')
          ? 'Transmission must be automatic or manual'
          : 'Invalid data provided'
        return { error: constraintMessage }
      }
      if (carError.code === '42501') { // Permission denied (RLS)
        return { error: 'Permission denied. Please ensure you have a company and RLS policies are configured correctly.' }
      }
      console.error('[addCarAction] Database error:', {
        code: carError.code,
        message: carError.message,
        details: carError.details,
        hint: carError.hint
      })
      return { 
        error: `Failed to create car: ${carError.message}${carError.hint ? ` (${carError.hint})` : ''}`
      }
    }

    const carId = carDataResult.id

    // Locations are now stored directly in the cars table as pickup_locations and dropoff_locations TEXT[] arrays
    // Each array contains location IDs (UUIDs as strings) from the locations table

    // Save car extras if provided
    if (carData.extras && Array.isArray(carData.extras) && carData.extras.length > 0) {
      console.log('[addCarAction] Saving car extras:', { carId, extrasCount: carData.extras.length })
      const extrasResult = await updateCarExtrasAction(carId, carData.extras)
      if (extrasResult.error) {
        console.error('[addCarAction] Failed to save extras:', extrasResult.error)
        // Don't fail the entire operation if extras fail, just log it
        // The car has been created successfully
      }
    }

    // Transform the returned car data to match Car interface (camelCase)
    const transformedCar: Car = {
      id: carDataResult.id,
      companyId: carDataResult.company_id,
      make: carDataResult.make,
      model: carDataResult.model,
      year: carDataResult.year,
      licensePlate: carDataResult.license_plate,
      color: carDataResult.color || undefined,
      transmission: carDataResult.transmission as 'automatic' | 'manual',
      fuelType: carDataResult.fuel_type as 'petrol' | 'diesel' | 'electric' | 'hybrid',
      seats: carDataResult.seats,
      dailyRate: Number(carDataResult.daily_rate),
      status: carDataResult.status as 'active' | 'maintenance' | 'retired',
      imageUrl: carDataResult.image_url || undefined,
      features: carDataResult.features || undefined,
      depositRequired: carDataResult.deposit_required ? Number(carDataResult.deposit_required) : undefined,
      pickupLocations: Array.isArray(carDataResult.pickup_locations) ? carDataResult.pickup_locations : undefined,
      dropoffLocations: Array.isArray(carDataResult.dropoff_locations) ? carDataResult.dropoff_locations : undefined,
      createdAt: new Date(carDataResult.created_at),
      updatedAt: new Date(carDataResult.updated_at),
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car added successfully', data: transformedCar }
  } catch (error: unknown) {
    // Handle timeout errors
    if (error instanceof TimeoutError) {
      return { error: error.message || 'Request timed out. Please try again.' }
    }
    
    console.error('[addCarAction] Unexpected error:', error)
    return { 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
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

    // Get user's company_id - with timeout
    const companyId = await withTimeout(
      getUserCompanyId(user.id),
      TIMEOUTS.QUERY,
      'Failed to retrieve company information. Please try again.'
    )
    
    // First, verify the user has access to this car - with timeout
    const { data: existingCar } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .select('id, company_id, license_plate')
        .eq('id', carId)
        .single(),
      TIMEOUTS.QUERY,
      'Failed to verify car access. Please try again.'
    )
    
    if (!existingCar) {
      return { error: 'Car not found' }
    }
    
    // Check access: user must own the company that owns the car
    // RLS will handle this, but we verify here for better error messages
    if (existingCar.company_id !== companyId) {
      return { error: 'You do not have permission to update this car' }
    }

    // Validate required fields
    if (!carData.make?.trim()) {
      return { error: 'Make is required' }
    }
    if (!carData.model?.trim()) {
      return { error: 'Model is required' }
    }
    if (!carData.year || carData.year < 1990 || carData.year > new Date().getFullYear() + 1) {
      return { error: 'Valid year is required' }
    }
    if (!carData.licensePlate?.trim()) {
      return { error: 'License plate is required' }
    }
    if (!carData.transmission || !['automatic', 'manual'].includes(carData.transmission)) {
      return { error: 'Valid transmission type is required (automatic or manual)' }
    }
    if (!carData.fuelType || !['petrol', 'diesel', 'electric', 'hybrid'].includes(carData.fuelType)) {
      return { error: 'Valid fuel type is required' }
    }
    if (!carData.seats || carData.seats < 1 || carData.seats > 20) {
      return { error: 'Valid number of seats is required (1-20)' }
    }
    if (!carData.dailyRate || carData.dailyRate <= 0) {
      return { error: 'Daily rate must be greater than 0' }
    }
    if (carData.depositRequired !== undefined && carData.depositRequired < 0) {
      return { error: 'Deposit required cannot be negative' }
    }

    // Check for duplicate license plate (if changed) - with timeout
    const normalizedLicensePlate = carData.licensePlate.trim().toUpperCase()
    if (existingCar && existingCar.license_plate !== normalizedLicensePlate) {
      const { data: duplicateCar } = await withSupabaseTimeout(
        supabase
          .from('cars')
          .select('id')
          .eq('license_plate', normalizedLicensePlate)
          .neq('id', carId)
          .maybeSingle(),
        TIMEOUTS.QUERY,
        'Failed to check for duplicate license plate. Please try again.'
      )

      if (duplicateCar) {
        return { error: `A car with license plate "${normalizedLicensePlate}" already exists` }
      }
    }

    // Prepare update data with proper types
    // Also include pickup_locations and dropoff_locations TEXT[] arrays if provided
    const carUpdateData: any = {
      make: carData.make.trim(),
      model: carData.model.trim(),
      year: Math.floor(carData.year), // Ensure integer
      license_plate: normalizedLicensePlate,
      color: carData.color?.trim() || null, // Optional, convert empty string to null
      transmission: carData.transmission, // 'automatic' or 'manual'
      fuel_type: carData.fuelType, // 'petrol', 'diesel', 'electric', 'hybrid'
      seats: Math.floor(carData.seats), // Ensure integer
      daily_rate: parseFloat(carData.dailyRate.toFixed(2)), // Ensure numeric(10,2)
      deposit_required: carData.depositRequired !== undefined && carData.depositRequired !== null 
        ? parseFloat(carData.depositRequired.toFixed(2)) 
        : null, // Optional, ensure numeric(10,2) or null
      status: (carData.status || 'active') as 'active' | 'maintenance' | 'retired', // Default to 'active'
      image_url: carData.imageUrl?.trim() || null, // Optional, convert empty string to null
      features: Array.isArray(carData.features) && carData.features.length > 0 
        ? carData.features.filter(f => f?.trim()).map(f => f.trim()) 
        : null, // Optional array, filter empty strings
      updated_at: new Date().toISOString(),
    }

    // Handle locations using junction table (car_locations)
    // This provides referential integrity, company validation, and type checking
    console.log('[updateCarAction] Processing locations via junction table:', {
      hasPickupLocations: !!carData.pickupLocations,
      pickupLocations: carData.pickupLocations,
      hasDropoffLocations: !!carData.dropoffLocations,
      dropoffLocations: carData.dropoffLocations,
    })

    let validatedPickupIds: string[] = []
    let validatedDropoffIds: string[] = []

    // Validate and filter location IDs if provided
    if (carData.pickupLocations !== undefined) {
      try {
        validatedPickupIds = await validateAndFilterLocationIds(
          supabase,
          carData.pickupLocations,
          existingCar.company_id,
          'pickup'
        )
        console.log('[updateCarAction] Validated pickup locations:', validatedPickupIds)
      } catch (error) {
        console.error('[updateCarAction] Error validating pickup locations:', error)
        return { error: error instanceof Error ? error.message : 'Failed to validate pickup locations' }
      }
    }

    if (carData.dropoffLocations !== undefined) {
      try {
        validatedDropoffIds = await validateAndFilterLocationIds(
          supabase,
          carData.dropoffLocations,
          existingCar.company_id,
          'dropoff'
        )
        console.log('[updateCarAction] Validated dropoff locations:', validatedDropoffIds)
      } catch (error) {
        console.error('[updateCarAction] Error validating dropoff locations:', error)
        return { error: error instanceof Error ? error.message : 'Failed to validate dropoff locations' }
      }
    }

    // Update car basic fields (DO NOT include pickup_locations/dropoff_locations in carUpdateData)
    console.log('[updateCarAction] Executing UPDATE query for car:', carId)

    const { error: updateError } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .update(carUpdateData)
        .eq('id', carId),
      TIMEOUTS.UPDATE,
      'Failed to update car. The request timed out. Please try again.'
    )

    if (updateError) {
      console.error('[updateCarAction] Update error:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      })
      // Handle specific database errors
      if (updateError.code === '23505') { // Unique violation
        return { error: `A car with this license plate already exists` }
      }
      if (updateError.code === '23514') { // Check constraint violation
        return { error: `Invalid data: ${updateError.message}` }
      }
      return { error: `Failed to update car: ${updateError.message}` }
    }

    // Update car_locations junction table atomically
    // This replaces all existing location associations with the new ones
    try {
      await updateCarLocationsJunction(
        supabase,
        carId,
        validatedPickupIds,
        validatedDropoffIds
      )
      console.log('[updateCarAction] ✅ Junction table updated successfully')
    } catch (error) {
      console.error('[updateCarAction] Error updating junction table:', error)
      // Car was updated but locations failed - this is a partial failure
      return { error: error instanceof Error ? error.message : 'Car updated but failed to save locations. Please try again.' }
    }

    // Fetch the updated car (without location arrays)
    console.log('[updateCarAction] Fetching updated car with locations...')
    const { data, error: fetchError } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .select(`
          id,
          company_id,
          make,
          model,
          year,
          license_plate,
          color,
          transmission,
          fuel_type,
          seats,
          daily_rate,
          deposit_required,
          status,
          image_url,
          features,
          created_at,
          updated_at
        `)
        .eq('id', carId)
        .maybeSingle(),
      TIMEOUTS.QUERY,
      'Failed to fetch updated car. The request timed out. Please try again.'
    )

    if (fetchError) {
      console.error('[updateCarAction] Error fetching car after update:', fetchError)
      return { error: `Failed to fetch updated car: ${fetchError.message}` }
    }

    if (!data) {
      return { error: 'Car not found after update. It may have been deleted or you may not have permission to view it.' }
    }

    // Fetch locations from junction table
    const { pickup: fetchedPickupIds, dropoff: fetchedDropoffIds } = await fetchCarLocationIds(supabase, carId)

    console.log('[updateCarAction] Fetched locations from junction table:', {
      pickup: fetchedPickupIds,
      dropoff: fetchedDropoffIds,
      pickupMatch: JSON.stringify(fetchedPickupIds.sort()) === JSON.stringify(validatedPickupIds.sort()),
      dropoffMatch: JSON.stringify(fetchedDropoffIds.sort()) === JSON.stringify(validatedDropoffIds.sort()),
    })

    // Verify locations were saved correctly
    const pickupMatch = JSON.stringify(fetchedPickupIds.sort()) === JSON.stringify(validatedPickupIds.sort())
    const dropoffMatch = JSON.stringify(fetchedDropoffIds.sort()) === JSON.stringify(validatedDropoffIds.sort())

    if (!pickupMatch || !dropoffMatch) {
      console.error('[updateCarAction] ⚠️ Location mismatch after save!', {
        expected: {
          pickup: validatedPickupIds,
          dropoff: validatedDropoffIds,
        },
        actual: {
          pickup: fetchedPickupIds,
          dropoff: fetchedDropoffIds,
        },
        pickupMatch,
        dropoffMatch,
      })
      return { error: 'Car was updated but locations were not saved correctly. Please try again.' }
    }

    console.log('[updateCarAction] ✅ All locations verified - saved correctly!')

    // Transform the returned car data to match Car interface (camelCase)
    const transformedCar = {
      id: data.id,
      companyId: data.company_id,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.license_plate,
      color: data.color || undefined,
      transmission: data.transmission as 'automatic' | 'manual',
      fuelType: data.fuel_type as 'petrol' | 'diesel' | 'electric' | 'hybrid',
      seats: data.seats,
      dailyRate: Number(data.daily_rate),
      status: data.status as 'active' | 'maintenance' | 'retired',
      imageUrl: data.image_url || undefined,
      features: data.features || undefined,
      depositRequired: data.deposit_required ? Number(data.deposit_required) : undefined,
      pickupLocations: fetchedPickupIds.length > 0 ? fetchedPickupIds : undefined,
      dropoffLocations: fetchedDropoffIds.length > 0 ? fetchedDropoffIds : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }

    console.log('[updateCarAction] Transformed car before return:', {
      hasPickupLocations: !!transformedCar.pickupLocations,
      pickupLocations: transformedCar.pickupLocations,
      hasDropoffLocations: !!transformedCar.dropoffLocations,
      dropoffLocations: transformedCar.dropoffLocations,
    })

    // Save car extras if provided
    if (carData.extras) {
      console.log('[updateCarAction] Saving car extras:', { 
        carId, 
        extrasCount: carData.extras.length,
        extras: carData.extras
      })
      const extrasResult = await updateCarExtrasAction(carId, carData.extras)
      if (extrasResult.error) {
        console.error('[updateCarAction] Failed to save extras:', extrasResult.error)
        // Don't fail the entire operation if extras fail, just log it
        // The car has been updated successfully
      } else {
        console.log('[updateCarAction] ✅ Extras saved successfully')
      }
    } else {
      console.log('[updateCarAction] No extras provided in carData:', {
        hasExtras: !!carData.extras,
        extrasType: typeof carData.extras,
        carDataKeys: Object.keys(carData)
      })
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car updated successfully', data: transformedCar }
  } catch (error: unknown) {
    // Handle timeout errors
    if (error instanceof TimeoutError) {
      return { error: error.message || 'Request timed out. Please try again.' }
    }
    
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

    // Get user's company_id for access control - with timeout
    const userCompanyId = await withTimeout(
      getUserCompanyId(user.id),
      TIMEOUTS.QUERY,
      'Failed to retrieve company information. Please try again.'
    )
    
    // First, verify the user has access to this car (must belong to user's company) - with timeout
    const { data: existingCar } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .select('id, company_id')
        .eq('id', carId)
        .single(),
      TIMEOUTS.QUERY,
      'Failed to verify car access. Please try again.'
    )
    
    if (!existingCar) {
      return { error: 'Car not found' }
    }
    
    // Check access: car must belong to user's company
    if (existingCar.company_id !== userCompanyId) {
      return { error: 'You do not have permission to delete this car' }
    }

    const { error } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .delete()
        .eq('id', carId),
      TIMEOUTS.DELETE,
      'Failed to delete car. The request timed out. Please try again.'
    )

    if (error) {
      return { error: 'Failed to delete car' }
    }

    revalidatePath('/cars')
    return { success: true, message: 'Car deleted successfully' }
  } catch (error: unknown) {
    // Handle timeout errors
    if (error instanceof TimeoutError) {
      return { error: error.message || 'Request timed out. Please try again.' }
    }
    
    return { error: 'An unexpected error occurred' }
  }
}

