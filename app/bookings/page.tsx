import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import BookingsPageRedesigned from '@/app/components/domain/bookings/bookings-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import { getUserCompanyId, getUserCompany } from '@/lib/server/data/company-helpers'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Bookings Page for Car Owners
 * 
 * This page displays all bookings for the authenticated owner.
 * Unauthenticated users are redirected to the login page.
 */
export default async function BookingsRoute() {
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
  let profile: { agency_name?: string; logo?: string } | null = null
  try {
    const companyId = await getUserCompanyId(user.id)
    if (companyId) {
      const company = await getUserCompany(user.id)
      if (company) {
        profile = {
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
  
  // Fetch bookings with car, customer, and location details from Supabase
  // RLS automatically filters by company_id based on auth.uid() and companies.owner_id
  // No manual filtering needed - RLS handles all access control
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(
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
      ),
      customer:customers(
        id,
        user_id,
        full_name,
        phone
      ),
      pickup_location:locations!pickup_location_id(
        id,
        name,
        address_line_1,
        city
      ),
      dropoff_location:locations!dropoff_location_id(
        id,
        name,
        address_line_1,
        city
      )
    `)
    .order('created_at', { ascending: false })
  
  // Log errors for debugging
  if (bookingsError) {
    console.error('[BookingsPage] Error fetching bookings:', {
      message: bookingsError.message,
      code: bookingsError.code,
      details: bookingsError.details,
      hint: bookingsError.hint
    })
  }
  
  console.log('[BookingsPage] Fetched bookings:', {
    count: bookings?.length || 0
  })

  // Transform bookings data to match Booking interface
  const transformedBookings = (bookings || []).map((booking: any) => ({
    id: booking.id,
    bookingReference: booking.booking_reference || undefined,
    companyId: booking.company_id,
    carId: booking.car_id,
    customerId: booking.customer_id,
    pickupLocationId: booking.pickup_location_id,
    dropoffLocationId: booking.dropoff_location_id,
    startTs: new Date(booking.start_ts),
    endTs: new Date(booking.end_ts),
    totalPrice: Number(booking.total_price),
    status: booking.status as 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled',
    notes: booking.notes || undefined,
    createdAt: new Date(booking.created_at),
    updatedAt: new Date(booking.updated_at),
    // Joined data
    car: booking.car ? {
      id: booking.car.id,
      companyId: booking.car.company_id,
      make: booking.car.make,
      model: booking.car.model,
      year: booking.car.year,
      licensePlate: booking.car.license_plate,
      color: booking.car.color || undefined,
      transmission: booking.car.transmission as 'automatic' | 'manual',
      fuelType: booking.car.fuel_type as 'petrol' | 'diesel' | 'electric' | 'hybrid',
      seats: Number(booking.car.seats || 0),
      dailyRate: Number(booking.car.daily_rate || 0),
      depositRequired: booking.car.deposit_required ? Number(booking.car.deposit_required) : undefined,
      status: booking.car.status as 'active' | 'maintenance' | 'retired',
      imageUrl: booking.car.image_url || undefined,
      features: booking.car.features || undefined,
      createdAt: new Date(booking.car.created_at),
      updatedAt: new Date(booking.car.updated_at),
    } : undefined,
    customer: booking.customer ? {
      id: booking.customer.id,
      email: '', // Email is not stored in customers table, would need to join with auth.users
      phone: booking.customer.phone || '',
      fullName: booking.customer.full_name,
      // Parse full_name into firstName and lastName if possible
      ...(booking.customer.full_name ? (() => {
        const nameParts = booking.customer.full_name.trim().split(/\s+/)
        return {
          firstName: nameParts[0] || undefined,
          lastName: nameParts.slice(1).join(' ') || undefined,
          name: booking.customer.full_name,
        }
      })() : {}),
    } : undefined,
    pickupLocation: booking.pickup_location ? {
      id: booking.pickup_location.id,
      name: booking.pickup_location.name,
      addressLine1: booking.pickup_location.address_line_1 || undefined,
      city: booking.pickup_location.city || undefined,
    } : undefined,
    dropoffLocation: booking.dropoff_location ? {
      id: booking.dropoff_location.id,
      name: booking.dropoff_location.name,
      addressLine1: booking.dropoff_location.address_line_1 || undefined,
      city: booking.dropoff_location.city || undefined,
    } : undefined,
    // Computed fields
    carName: booking.car ? `${booking.car.make} ${booking.car.model} ${booking.car.year}` : undefined,
    carPlate: booking.car?.license_plate,
    customerName: booking.customer?.full_name,
    customerPhone: booking.customer?.phone,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userEmail={user.email || ''}
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Show alert if no company - non-blocking */}
        {!companyId && <NoCompanyAlert />}
        
        {/* Always show bookings page */}
        <BookingsPageRedesigned initialBookings={transformedBookings} />
      </main>
    </div>
  )
}

