import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import DashboardContent from '@/app/components/domain/dashboard/dashboard-content'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import QuickStartGuide from '@/app/components/ui/onboarding/quick-start-guide'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import RoleAssignmentHandler from '@/app/components/ui/auth/role-assignment-handler'
import { Booking } from '@/types/booking'
import { getUserCompanyId, getUserCompany } from '@/lib/server/data/company-helpers'
import { getOnboardingStatus } from '@/lib/server/data/quick-start-helpers'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Dashboard Page for Car Owners
 * 
 * Main dashboard showing overview statistics and recent bookings.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function DashboardPage() {
  const supabase = await createServerComponentClient()
  
  // Check authentication using getUser() for security
  // getUser() validates with the server, unlike getSession() which only reads from cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  // Do this FIRST before any async operations to prevent streaming errors
  if (!user) {
    redirect('/login')
  }

  // Check role - read-only check, no side effects
  // If user has a non-partner role, redirect immediately
  const userRole = (user.app_metadata?.role as string) || null
  if (userRole !== null && userRole !== 'partner') {
    // User has a role that is NOT "partner" - redirect immediately
    const customerSiteUrl = process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || 'https://customer.wheely.com'
    redirect(customerSiteUrl)
  }

  // If role is NULL, allow access but role assignment will happen via client-side call
  // This keeps server components read-only and prevents streaming errors

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
  } catch (err: unknown) {
    // Silently continue without profile data - it's optional
  }

  // Get user's company ID (read-only, no side effects)
  const companyId = await getUserCompanyId(user.id)
  
  // Check onboarding status for Quick Start Guide
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
  
  // Fetch bookings with car and customer details from Supabase
  // Bookings are company-scoped (bookings.company_id is required)
  let dbBookings = null
  try {
    if (!companyId) {
      dbBookings = []
    } else {
      // First, fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
    
    if (bookingsError) {
      console.error('Error fetching bookings:', {
        message: bookingsError.message,
        code: bookingsError.code,
        details: bookingsError.details,
        hint: bookingsError.hint,
      })
      dbBookings = []
    } else if (bookingsData && bookingsData.length > 0) {
      // Fetch related cars and customers
      const carIds = [...new Set(bookingsData.map((b: any) => b.car_id).filter(Boolean))]
      const customerIds = [...new Set(bookingsData.map((b: any) => b.customer_id).filter(Boolean))]
      
      const [carsResult, customersResult] = await Promise.all([
        carIds.length > 0 
          ? supabase
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
              .in('id', carIds)
          : Promise.resolve({ data: [], error: null }),
        customerIds.length > 0
          ? supabase.from('customers').select('*').in('id', customerIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      
      // Combine the data
      const carsMap = new Map((carsResult.data || []).map((car: any) => [car.id, car]))
      const customersMap = new Map((customersResult.data || []).map((customer: any) => [customer.id, customer]))
      
      dbBookings = bookingsData.map((booking: any) => ({
        ...booking,
        cars: carsMap.get(booking.car_id) || null,
        customers: customersMap.get(booking.customer_id) || null,
      }))
    } else {
      dbBookings = []
    }
    }
  } catch (err: any) {
    console.error('Unexpected error fetching bookings:', {
      message: err?.message || 'Unknown error',
      stack: err?.stack || 'No stack trace',
      name: err?.name || 'Unknown error type',
    })
    dbBookings = []
  }

  // Convert snake_case to camelCase for client components with error handling
  const bookings: Booking[] = (dbBookings || []).map((booking: any) => {
    // Safe date parsing helper
    const parseDate = (dateValue: any): Date | undefined => {
      if (!dateValue) return undefined
      try {
        const parsed = new Date(dateValue)
        if (isNaN(parsed.getTime())) return undefined
        return parsed
      } catch {
        return undefined
      }
    }

    return {
      id: booking.id,
      bookingReference: booking.booking_reference || booking.bookingReference,
      companyId: booking.company_id || booking.companyId || '',
      carId: booking.car_id || booking.carId,
      customerId: booking.customer_id || booking.customerId,
      pickupLocationId: booking.pickup_location_id || booking.pickupLocationId || '',
      dropoffLocationId: booking.dropoff_location_id || booking.dropoffLocationId || '',
      startTs: parseDate(booking.start_ts || booking.startTs || booking.pickup_date) || new Date(),
      endTs: parseDate(booking.end_ts || booking.endTs || booking.dropoff_date) || new Date(),
      totalPrice: booking.total_price || booking.totalPrice || 0,
      status: booking.status || 'pending',
      notes: booking.notes,
      createdAt: parseDate(booking.created_at) || new Date(),
      updatedAt: parseDate(booking.updated_at) || new Date(),
      car: booking.cars ? {
        id: (booking.cars || booking.car).id,
        companyId: (booking.cars || booking.car).company_id || (booking.cars || booking.car).companyId || '',
        make: (booking.cars || booking.car).make || '',
        model: (booking.cars || booking.car).model || '',
        year: (booking.cars || booking.car).year || new Date().getFullYear(),
        licensePlate: (booking.cars || booking.car).license_plate || (booking.cars || booking.car).licensePlate || '',
        imageUrl: (booking.cars || booking.car).image_url || (booking.cars || booking.car).imageUrl || '',
        dailyRate: (booking.cars || booking.car).daily_rate || (booking.cars || booking.car).dailyRate || 0,
        status: (booking.cars || booking.car).status || 'active',
        transmission: (booking.cars || booking.car).transmission || 'automatic',
        fuelType: (booking.cars || booking.car).fuel_type || (booking.cars || booking.car).fuelType || 'petrol',
        seats: (booking.cars || booking.car).seats || 5,
        color: (booking.cars || booking.car).color || '',
        features: (booking.cars || booking.car).features || [],
        depositRequired: (booking.cars || booking.car).deposit_required || (booking.cars || booking.car).depositRequired,
        createdAt: parseDate((booking.cars || booking.car).created_at || (booking.cars || booking.car).createdAt) || new Date(),
        updatedAt: parseDate((booking.cars || booking.car).updated_at || (booking.cars || booking.car).updatedAt) || new Date(),
      } : undefined,
      customer: booking.customers ? {
        id: booking.customers.id,
        firstName: booking.customers.first_name || '',
        lastName: booking.customers.last_name || '',
        email: booking.customers.email || '',
        phone: booking.customers.phone || '',
        address: booking.customers.address || '',
        city: booking.customers.city || '',
        country: booking.customers.country || '',
        postalCode: booking.customers.postal_code || '',
        createdAt: parseDate(booking.customers.created_at) || new Date(),
        updatedAt: parseDate(booking.customers.updated_at),
      } : undefined,
    }
  }).filter((booking) => {
    // Filter out invalid bookings
    return booking.id && booking.createdAt
  }) as Booking[]

  return (
    <>
      {/* Role assignment handler - client component that assigns role after render */}
      <RoleAssignmentHandler userRole={userRole} />
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
        
        {/* Always show dashboard content */}
        <DashboardContent 
          userEmail={user.email || ''}
          agencyName={profileData?.agency_name}
          bookings={bookings}
        />
      </main>
    </>
  )
}

