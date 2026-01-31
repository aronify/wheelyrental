import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import CarsPageRedesigned from '@/app/components/domain/cars/cars-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import QuickStartGuide from '@/app/components/ui/onboarding/quick-start-guide'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import { getUserCompanyId, getCompanyById } from '@/lib/server/data/company'
import { getOnboardingStatus } from '@/lib/server/data/onboarding'

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

  const companyId = await getUserCompanyId(user.id)

  const defaultOnboarding = {
    isComplete: false,
    completedSteps: [] as string[],
    totalSteps: 3,
    progress: 0,
    steps: { profileComplete: false, hasLocations: false, hasCars: false },
  }

  // Run company profile, onboarding, and cars fetch in parallel
  const [companyForProfile, onboardingStatus, carsResult] = await Promise.all([
    companyId ? getCompanyById(companyId) : Promise.resolve(null),
    companyId ? getOnboardingStatus(companyId) : Promise.resolve(defaultOnboarding),
    supabase
      .from('cars')
      .select(`*, company:companies(id, name, email, phone, website)`)
      .order('created_at', { ascending: false }),
  ])

  const profileData: { agency_name?: string; logo?: string } | null = companyForProfile
    ? { agency_name: companyForProfile.name || undefined, logo: companyForProfile.logo || undefined }
    : null

  const { data: dbCars, error: carsError } = carsResult
  if (carsError) {
    console.error('[CarsPage] Error fetching cars:', carsError.message)
  }

  let carLocationsMap: Record<string, {
    pickup: Array<{ id: string; name: string; address: string; city: string }>
    dropoff: Array<{ id: string; name: string; address: string; city: string }>
  }> = {}
  let carExtrasMap: Record<string, Array<{ carId: string; extraId: string; price: number; isIncluded: boolean }>> = {}

  if (dbCars && dbCars.length > 0) {
    const carIds = dbCars.map((car: any) => car.id)

    const [carLocationsRes, carExtrasRes] = await Promise.all([
      supabase.from('car_locations').select('car_id, location_id, location_type').in('car_id', carIds),
      supabase.from('car_extras').select('car_id, extra_id, price, is_included').in('car_id', carIds),
    ])

    const carLocations = carLocationsRes.data
    const carExtras = carExtrasRes.data

    if (carExtras?.length) {
      for (const ce of carExtras) {
        if (!carExtrasMap[ce.car_id]) carExtrasMap[ce.car_id] = []
        carExtrasMap[ce.car_id].push({
          carId: ce.car_id,
          extraId: ce.extra_id,
          price: parseFloat(ce.price) || 0,
          isIncluded: !!ce.is_included,
        })
      }
    }

    if (carLocations?.length && companyId) {
      const locationIds = [...new Set(carLocations.map((cl: any) => cl.location_id))]
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, address, city, company_id, is_active')
        .in('id', locationIds)
        .eq('company_id', companyId)
        .eq('is_active', true)

      const locationsMap: Record<string, { id: string; name: string; address: string; city: string }> = {}
      for (const loc of locations || []) {
        locationsMap[loc.id] = {
          id: loc.id,
          name: loc.name || '',
          address: loc.address || '',
          city: loc.city || '',
        }
      }

      for (const cl of carLocations) {
        const location = locationsMap[cl.location_id]
        if (!location) continue
        if (!carLocationsMap[cl.car_id]) {
          carLocationsMap[cl.car_id] = { pickup: [], dropoff: [] }
        }
        if (cl.location_type === 'pickup') {
          carLocationsMap[cl.car_id].pickup.push(location)
        } else if (cl.location_type === 'dropoff') {
          carLocationsMap[cl.car_id].dropoff.push(location)
        }
      }
    }

    for (const car of dbCars) {
      if (!carLocationsMap[car.id]) carLocationsMap[car.id] = { pickup: [], dropoff: [] }
      if (!carExtrasMap[car.id]) carExtrasMap[car.id] = []
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
    imageUrl: car.image_url ? car.image_url.split(',')[0] : '', // First image is primary
    imageUrls: car.image_url ? car.image_url.split(',').map((url: string) => url.trim()).filter(Boolean) : undefined, // All images
    features: car.features || [],
    pickupLocation: undefined, // Deprecated - use pickupLocations array instead
    dropoffLocation: undefined, // Deprecated - use dropoffLocations array instead
    pickupLocations: carLocationsMap[car.id]?.pickup.length > 0 
      ? carLocationsMap[car.id].pickup.map(loc => loc.id)
      : undefined, // Array of location IDs (for backward compatibility)
    dropoffLocations: carLocationsMap[car.id]?.dropoff.length > 0
      ? carLocationsMap[car.id].dropoff.map(loc => loc.id)
      : undefined, // Array of location IDs (for backward compatibility)
    // Full location details for the info panel
    pickupLocationDetails: carLocationsMap[car.id]?.pickup || [],
    dropoffLocationDetails: carLocationsMap[car.id]?.dropoff || [],
    depositRequired: car.deposit_required ? Number(car.deposit_required) : undefined,
    createdAt: new Date(car.created_at),
    updatedAt: new Date(car.updated_at),
    // Extras from junction table
    extras: carExtrasMap[car.id] || [],
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
      
      <main className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 min-w-0 w-full">
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

