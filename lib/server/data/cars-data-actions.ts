'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { CarFormData, Car } from '@/types/car'
import { revalidatePath } from 'next/cache'
import { getUserCompanyId } from './company-helpers'
import { withTimeout, withSupabaseTimeout, TIMEOUTS, TimeoutError } from '@/lib/utils/timeout'

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
    const carInsertData = {
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

    // Note: Car locations are stored separately if car_locations junction table exists
    // This is optional and won't fail the car creation if the table doesn't exist
    // Locations are primarily used for bookings (pickup_location_id, dropoff_location_id)
    if (carData.pickupLocations && carData.pickupLocations.length > 0) {
      try {
        const pickupLocationEntries = carData.pickupLocations.map(locationId => ({
          car_id: carId,
          location_id: locationId,
          location_type: 'pickup' as const,
        }))

        const { error: pickupError } = await supabase
          .from('car_locations')
          .insert(pickupLocationEntries)

        if (pickupError && pickupError.code !== '42P01') { // 42P01 = table does not exist
          console.warn('[addCarAction] Error inserting pickup locations (non-critical):', pickupError.message)
        }
      } catch (error) {
        // Table might not exist - that's okay, locations are optional
        console.warn('[addCarAction] Car locations junction table may not exist (non-critical)')
      }
    }

    if (carData.dropoffLocations && carData.dropoffLocations.length > 0) {
      try {
        const dropoffLocationEntries = carData.dropoffLocations.map(locationId => ({
          car_id: carId,
          location_id: locationId,
          location_type: 'dropoff' as const,
        }))

        const { error: dropoffError } = await supabase
          .from('car_locations')
          .insert(dropoffLocationEntries)

        if (dropoffError && dropoffError.code !== '42P01') { // 42P01 = table does not exist
          console.warn('[addCarAction] Error inserting dropoff locations (non-critical):', dropoffError.message)
        }
      } catch (error) {
        // Table might not exist - that's okay, locations are optional
        console.warn('[addCarAction] Car locations junction table may not exist (non-critical)')
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
    const carUpdateData = {
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

    // Update the car - with timeout
    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('cars')
        .update(carUpdateData)
        .eq('id', carId)
        .select()
        .single(),
      TIMEOUTS.UPDATE,
      'Failed to update car. The request timed out. Please try again.'
    )

    if (error) {
      // Handle specific database errors
      if (error.code === '23505') { // Unique violation
        return { error: `A car with this license plate already exists` }
      }
      if (error.code === '23514') { // Check constraint violation
        return { error: `Invalid data: ${error.message}` }
      }
      return { error: `Failed to update car: ${error.message}` }
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

