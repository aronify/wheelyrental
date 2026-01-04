import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import CarsPageRedesigned from '@/app/components/domain/cars/cars-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import CompanyDataPrompt from '@/app/components/ui/alerts/company-data-prompt'
import { ensureUserCompany, companyHasMinimalData, getUserCompanyId, getUserCompany } from '@/lib/server/data/company-helpers'

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

  // Ensure user has a company (create if doesn't exist)
  const companyId = await ensureUserCompany(user.id, user.email)
  
  // Check if company has minimal required data
  const hasMinimalData = companyId ? await companyHasMinimalData(companyId) : false
  
  if (!companyId) {
    // If company creation failed, still show page but with error state
    console.error('Failed to create or retrieve company for user')
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          userEmail={user.email || ''} 
          agencyName={profileData?.agency_name}
          agencyLogo={profileData?.logo}
        />
        <QuickAccessMenu />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <CompanyDataPrompt hasMinimalData={false} />
          <CarsPageRedesigned initialCars={[]} />
        </main>
      </div>
    )
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
    pickupLocation: undefined, // Locations are in company_locations table
    dropoffLocation: undefined, // Locations are in company_locations table
    pickupLocations: undefined, // Will be fetched from car_locations junction table if it exists
    dropoffLocations: undefined, // Will be fetched from car_locations junction table if it exists
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
        <CompanyDataPrompt hasMinimalData={hasMinimalData} />
        <CarsPageRedesigned initialCars={cars} />
      </main>
    </div>
  )
}

