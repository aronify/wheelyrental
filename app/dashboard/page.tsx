import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import DashboardContent from '@/app/components/domain/dashboard/dashboard-content'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import { Booking } from '@/types/booking'

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
  if (!user) {
    redirect('/login')
  }

  // Fetch profile for header - handle case where profile doesn't exist
  let profile = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('agency_name, logo')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay, profile might not exist yet
      console.error('Error fetching profile:', {
        error: error,
        message: error?.message || 'Unknown error',
        code: error?.code || 'No error code',
        details: error?.details || null,
        hint: error?.hint || null,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })
    } else if (!error) {
      profile = data
    }
  } catch (err: any) {
    console.error('Unexpected error fetching profile:', {
      message: err?.message,
      stack: err?.stack,
    })
    // Continue without profile - it's optional
  }

  // Fetch bookings with car and customer details from Supabase
  // Using a simpler query approach that works reliably
  let dbBookings = null
  try {
    // First, fetch bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
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
      const carIds = [...new Set(bookingsData.map(b => b.car_id).filter(Boolean))]
      const customerIds = [...new Set(bookingsData.map(b => b.customer_id).filter(Boolean))]
      
      const [carsResult, customersResult] = await Promise.all([
        carIds.length > 0 
          ? supabase.from('cars').select('*').in('id', carIds)
          : Promise.resolve({ data: [], error: null }),
        customerIds.length > 0
          ? supabase.from('customers').select('*').in('id', customerIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      
      // Combine the data
      const carsMap = new Map((carsResult.data || []).map(car => [car.id, car]))
      const customersMap = new Map((customersResult.data || []).map(customer => [customer.id, customer]))
      
      dbBookings = bookingsData.map(booking => ({
        ...booking,
        cars: carsMap.get(booking.car_id) || null,
        customers: customersMap.get(booking.customer_id) || null,
      }))
    } else {
      dbBookings = []
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
      carId: booking.car_id,
      customerId: booking.customer_id,
      pickupDate: parseDate(booking.pickup_date),
      dropoffDate: parseDate(booking.dropoff_date),
      totalPrice: booking.total_price || 0,
      status: booking.status || 'pending',
      createdAt: parseDate(booking.created_at) || new Date(),
      updatedAt: parseDate(booking.updated_at),
      car: booking.cars ? {
        id: booking.cars.id,
        make: booking.cars.make || '',
        model: booking.cars.model || '',
        year: booking.cars.year || new Date().getFullYear(),
        licensePlate: booking.cars.license_plate || '',
        imageUrl: booking.cars.image_url || '',
        dailyRate: booking.cars.daily_rate || 0,
        status: booking.cars.status || 'available',
        transmission: booking.cars.transmission || 'automatic',
        fuelType: booking.cars.fuel_type || 'petrol',
        seats: booking.cars.seats || 5,
        color: booking.cars.color || '',
        vin: booking.cars.vin || '',
        features: booking.cars.features || [],
        ownerId: booking.cars.owner_id,
        createdAt: parseDate(booking.cars.created_at) || new Date(),
        updatedAt: parseDate(booking.cars.updated_at) || new Date(),
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
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      <DashboardContent 
        userEmail={user.email || ''}
        agencyName={profile?.agency_name}
        bookings={bookings}
      />
    </>
  )
}

