import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import CarsPageRedesigned from '@/app/components/domain/cars/cars-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'

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

  // Fetch profile for header (needed for early return case)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('agency_name, logo')
    .eq('user_id', user.id)
    .single()

  // Get user's company_id from their cars
  // Since cars.company_id is required, we get it from any car
  const { data: userCar } = await supabase
    .from('cars')
    .select('company_id')
    .limit(1)
    .single()
  
  const companyId = userCar?.company_id
  
  if (!companyId) {
    // User has no cars yet - they need to create one first
    // For now, return empty array
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          userEmail={user.email || ''} 
          agencyName={profileData?.agency_name}
          agencyLogo={profileData?.logo}
        />
        <QuickAccessMenu />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <CarsPageRedesigned initialCars={[]} />
        </main>
      </div>
    )
  }
  
  // Fetch cars from Supabase with company information
  // Query cars by company_id (company-scoped)
  const { data: dbCars } = await supabase
    .from('cars')
    .select(`
      *,
      company:companies(
        id,
        name,
        is_verified,
        email,
        phone,
        website
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

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
      isVerified: car.company.is_verified || false,
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
    pickupLocation: undefined, // Locations are in company_locations table
    dropoffLocation: undefined, // Locations are in company_locations table
    pickupLocations: undefined, // Will be fetched from car_locations junction table if it exists
    dropoffLocations: undefined, // Will be fetched from car_locations junction table if it exists
    depositRequired: car.deposit_required ? Number(car.deposit_required) : undefined,
    createdAt: new Date(car.created_at),
    updatedAt: new Date(car.updated_at),
    // Computed fields
    isVerified: car.company?.is_verified === true,
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
        <CarsPageRedesigned initialCars={cars} />
      </main>
    </div>
  )
}

