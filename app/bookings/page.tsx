import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import BookingsPageRedesigned from '@/app/components/domain/bookings/bookings-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import { getUserCompanyId, getCompanyById } from '@/lib/server/data/company'

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

  const companyId = await getUserCompanyId(user.id)

  const [companyForProfile, bookingsResult] = await Promise.all([
    companyId ? getCompanyById(companyId) : Promise.resolve(null),
    supabase
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
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const profile: { agency_name?: string; logo?: string } | null = companyForProfile
    ? { agency_name: companyForProfile.name || undefined, logo: companyForProfile.logo || undefined }
    : null

  const { data: bookingsWithRelations, error: errWithRelations } = bookingsResult
  let bookings: any[] | null = null
  let bookingsError: { message: string; code?: string; details?: unknown; hint?: string } | null = null

  if (errWithRelations) {
    // Fallback: fetch bookings (no joins) when relation columns or tables (e.g. customers) differ or are missing
    const { data: bookingsOnly, error: errOnly } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (!errOnly && bookingsOnly != null) {
      const carIds = [...new Set(bookingsOnly.map((b: any) => b.car_id).filter(Boolean))]
      const customerIds = [...new Set(bookingsOnly.map((b: any) => b.customer_id).filter(Boolean))]
      const [carsRes, customersRes] = await Promise.all([
        carIds.length ? supabase.from('cars').select('*').in('id', carIds) : { data: [], error: null },
        customerIds.length
          ? Promise.resolve(supabase.from('customers').select('*').in('id', customerIds)).catch(() => ({ data: [] as any[], error: null }))
          : Promise.resolve({ data: [], error: null }),
      ])
      const carsMap = new Map((carsRes.data || []).map((c: any) => [c.id, c]))
      const customersMap = new Map((customersRes.data || []).map((c: any) => [c.id, c]))
      bookings = bookingsOnly.map((b: any) => ({
        ...b,
        car: carsMap.get(b.car_id) || null,
        customer: customersMap.get(b.customer_id) || null,
      }))
    } else {
      bookingsError = errWithRelations
      bookings = null
    }
  } else {
    bookings = bookingsWithRelations
  }

  if (bookingsError) {
    console.error('[BookingsPage] Error fetching bookings:', {
      message: bookingsError.message,
      code: bookingsError.code,
      details: bookingsError.details,
      hint: bookingsError.hint
    })
  }

  // Transform bookings data to match Booking interface (supports both schemas: start_ts/end_ts and start_date_time/end_date_time)
  const transformedBookings = (bookings || []).map((booking: any) => {
    const startTs = booking.start_ts || booking.start_date_time
    const endTs = booking.end_ts || booking.end_date_time
    return {
    id: booking.id,
    bookingReference: booking.booking_reference || undefined,
    companyId: booking.company_id || undefined,
    carId: booking.car_id,
    customerId: booking.customer_id,
    pickupLocationId: booking.pickup_location_id || undefined,
    dropoffLocationId: booking.dropoff_location_id || undefined,
    startTs: startTs ? new Date(startTs) : new Date(),
    endTs: endTs ? new Date(endTs) : new Date(),
    totalPrice: Number(booking.total_price ?? 0),
    status: (booking.status || 'pending') as 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled',
    notes: booking.notes || undefined,
    createdAt: booking.created_at ? new Date(booking.created_at) : new Date(),
    updatedAt: booking.updated_at ? new Date(booking.updated_at) : new Date(),
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
    customer: booking.customer ? (() => {
      const c = booking.customer
      const fullName = c.full_name || c.name || ''
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
      return {
        id: c.id,
        email: (c as any).email || '',
        phone: c.phone || '',
        fullName: fullName || undefined,
        firstName: nameParts[0] || undefined,
        lastName: nameParts.slice(1).join(' ') || undefined,
        name: fullName || undefined,
      }
    })() : undefined,
    pickupLocation: booking.pickup_location && typeof booking.pickup_location === 'object'
      ? {
          id: booking.pickup_location.id,
          name: booking.pickup_location.name,
          addressLine1: booking.pickup_location.address_line_1 || undefined,
          city: booking.pickup_location.city || undefined,
        }
      : (booking.pickup_location && typeof booking.pickup_location === 'string')
        ? { id: '', name: booking.pickup_location, addressLine1: undefined, city: undefined }
        : undefined,
    dropoffLocation: booking.dropoff_location && typeof booking.dropoff_location === 'object'
      ? {
          id: booking.dropoff_location.id,
          name: booking.dropoff_location.name,
          addressLine1: booking.dropoff_location.address_line_1 || undefined,
          city: booking.dropoff_location.city || undefined,
        }
      : (booking.dropoff_location && typeof booking.dropoff_location === 'string')
        ? { id: '', name: booking.dropoff_location, addressLine1: undefined, city: undefined }
        : undefined,
    // Computed fields
    carName: booking.car ? `${booking.car.make || ''} ${booking.car.model || ''} ${booking.car.year || ''}`.trim() : undefined,
    carPlate: booking.car?.license_plate,
    customerName: booking.customer?.full_name || (booking.customer as any)?.name,
    customerPhone: booking.customer?.phone,
  }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userEmail={user.email || ''}
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 min-w-0 w-full">
        {/* Show alert if no company - non-blocking */}
        {!companyId && <NoCompanyAlert />}
        
        {/* Always show bookings page */}
        <BookingsPageRedesigned initialBookings={transformedBookings} />
      </main>
    </div>
  )
}

