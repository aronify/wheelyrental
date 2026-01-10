import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import CarsPageRedesigned from '@/app/components/domain/cars/cars-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import QuickStartGuide from '@/app/components/ui/onboarding/quick-start-guide'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import { getUserCompanyId, getUserCompany } from '@/lib/server/data/company-helpers'
import { getOnboardingStatus } from '@/lib/server/data/quick-start-helpers'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Cars Management Page
 * 
 * Allows owners to add, edit, and delete cars in their fleet.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function CarsRoute() {
  const supabase = await createServerComponentClient()
  
  // Check authentication using getUser() for security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Fetch company data for header (profiles table doesn't exist - use companies table)
  let profileData: { agency_name?: string; logo?: string } | null = null
  try {
    const companyId = await getUserCompanyId(user.id)
    if (companyId) {
      const company = await getUserCompany(user.id)
      if (company) {
        profileData = {
          agency_name: company.name || undefined,
          logo: company.logo || undefined,
        }
      }
    }
  } catch (err) {
    // Silently continue without profile data
  }

  // Get user's company ID - DO NOT create automatically
  const companyId = await getUserCompanyId(user.id)
  
  // Check onboarding status for Quick Start Guide (only if company exists)
  const onboardingStatus = companyId 
    ? await getOnboardingStatus(companyId)
    : {
        isComplete: false,
        progress: 0,
        steps: {
          profileComplete: false,
          hasLocations: false,
          hasCars: false,
        }
      }
  
  // Fetch cars from Supabase with company information
  // RLS will automatically filter by company_id (JWT-based with fallback)
  // Try without explicit filter first (RLS handles it)
  let { data: dbCars, error: carsError } = await supabase
    .from('cars')
    .select(`
      *,
      company:companies(
        id,
        name,
        email,
        phone,
        website
      )
    `)
    .order('created_at', { ascending: false })
  
  // If query failed or returned no results, try with explicit company_id filter as fallback
  if (carsError || !dbCars || dbCars.length === 0) {
    console.warn('[CarsPage] Initial query failed or empty, trying with explicit company_id filter:', {
      error: carsError?.message,
      count: dbCars?.length || 0,
      companyId
    })
    
    // Retry with explicit filter (this might work if RLS is too restrictive)
    const retryResult = await supabase
      .from('cars')
      .select(`
        *,
        company:companies(
          id,
          name,
          email,
          phone,
          website
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (!retryResult.error && retryResult.data) {
      dbCars = retryResult.data
      carsError = retryResult.error
      console.log('[CarsPage] Retry with explicit filter succeeded:', retryResult.data.length)
    } else {
      console.error('[CarsPage] Retry also failed:', retryResult.error)
    }
  }
  
  // Log any errors for debugging
  if (carsError) {
    console.error('[CarsPage] Error fetching cars:', {
      message: carsError.message,
      code: carsError.code,
      details: carsError.details,
      hint: carsError.hint,
      companyId,
      rlsIssue: carsError.code === '42501' ? 'RLS might be blocking query' : 'Other error'
    })
  }
  
  // Debug: Log what we got
  console.log('[CarsPage] Fetched cars:', {
    count: dbCars?.length || 0,
    companyId,
    sampleCar: dbCars?.[0] ? { id: dbCars[0].id, company_id: dbCars[0].company_id } : null
  })

  // Fetch locations from junction table for all cars
  let carLocationsMap: Record<string, { pickup: string[]; dropoff: string[] }> = {}
  if (dbCars && dbCars.length > 0) {
    const carIds = dbCars.map((car: any) => car.id)
    const { data: carLocations } = await supabase
      .from('car_locations')
      .select('car_id, location_id, location_type')
      .in('car_id', carIds)

    // Group locations by car_id and type
    for (const car of dbCars) {
      const pickup: string[] = []
      const dropoff: string[] = []
      
      for (const cl of carLocations || []) {
        if (cl.car_id === car.id) {
          if (cl.location_type === 'pickup') {
            pickup.push(cl.location_id)
          } else if (cl.location_type === 'dropoff') {
            dropoff.push(cl.location_id)
          }
        }
      }
      
      carLocationsMap[car.id] = { pickup, dropoff }
    }
  }

  // Convert snake_case to camelCase and add computed fields
  const cars = (dbCars || []).map((car: any) => ({
    id: car.id,
    companyId: car.company_id,
    company: car.company ? {
      id: car.company.id,
      name: car.company.name,
      legalName: car.company.legal_name || undefined,
      email: car.company.email || '',
      phone: car.company.phone || '',
      website: car.company.website || undefined,
      isVerified: false, // Companies table doesn't have is_verified column
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    make: car.make,
    model: car.model,
    year: car.year,
    licensePlate: car.license_plate,
    color: car.color,
    transmission: car.transmission,
    fuelType: car.fuel_type,
    seats: car.seats,
    dailyRate: Number(car.daily_rate),
    status: car.status, // 'active', 'maintenance', 'retired'
    imageUrl: car.image_url || '',
    features: car.features || [],
    pickupLocation: undefined, // Deprecated - use pickupLocations array instead
    dropoffLocation: undefined, // Deprecated - use dropoffLocations array instead
    pickupLocations: carLocationsMap[car.id]?.pickup.length > 0 
      ? carLocationsMap[car.id].pickup 
      : undefined, // Array of location IDs from car_locations junction table
    dropoffLocations: carLocationsMap[car.id]?.dropoff.length > 0
      ? carLocationsMap[car.id].dropoff
      : undefined, // Array of location IDs from car_locations junction table
    depositRequired: car.deposit_required ? Number(car.deposit_required) : undefined,
    createdAt: new Date(car.created_at),
    updatedAt: new Date(car.updated_at),
    // Computed fields
    isVerified: false, // Companies table doesn't have is_verified column
    companyName: car.company?.name,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profileData?.agency_name}
        agencyLogo={profileData?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Show alert if no company - non-blocking */}
        {!companyId && <NoCompanyAlert />}
        
        {/* Show Quick Start Guide if company exists */}
        {companyId && (
          <QuickStartGuide 
            profileComplete={onboardingStatus.steps.profileComplete}
            hasLocations={onboardingStatus.steps.hasLocations}
            hasCars={onboardingStatus.steps.hasCars}
            progress={onboardingStatus.progress}
          />
        )}
        
        {/* Always show cars page */}
        <CarsPageRedesigned initialCars={cars} />
      </main>
    </div>
  )
}

