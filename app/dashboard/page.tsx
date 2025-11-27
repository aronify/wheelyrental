import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import DashboardContentRedesigned from './components/DashboardContentRedesigned'
import DashboardHeader from './components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'
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
  
  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login')
  }

  // Fetch profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_name, logo')
    .eq('user_id', session.user.id)
    .single()

  // Fetch bookings with car and customer details from Supabase
  const { data: dbBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      cars(*),
      customers(*)
    `)
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  // Convert snake_case to camelCase for client components
  const bookings: Booking[] = (dbBookings || []).map((booking: any) => ({
    id: booking.id,
    carId: booking.car_id,
    customerId: booking.customer_id,
    pickupDate: new Date(booking.pickup_date),
    dropoffDate: new Date(booking.dropoff_date),
    totalPrice: booking.total_price,
    status: booking.status,
    createdAt: new Date(booking.created_at),
    updatedAt: new Date(booking.updated_at),
    car: booking.cars ? {
      id: booking.cars.id,
      make: booking.cars.make,
      model: booking.cars.model,
      year: booking.cars.year,
      licensePlate: booking.cars.license_plate,
      imageUrl: booking.cars.image_url,
      dailyRate: booking.cars.daily_rate,
      status: booking.cars.status,
      transmission: booking.cars.transmission,
      fuelType: booking.cars.fuel_type,
      seats: booking.cars.seats,
      color: booking.cars.color,
      vin: booking.cars.vin,
      features: booking.cars.features,
      ownerId: booking.cars.owner_id,
      createdAt: new Date(booking.cars.created_at),
      updatedAt: new Date(booking.cars.updated_at),
    } : undefined,
    customer: booking.customers ? {
      id: booking.customers.id,
      firstName: booking.customers.first_name,
      lastName: booking.customers.last_name,
      email: booking.customers.email,
      phone: booking.customers.phone,
      address: booking.customers.address,
      city: booking.customers.city,
      country: booking.customers.country,
      postalCode: booking.customers.postal_code,
      createdAt: new Date(booking.customers.created_at),
      updatedAt: new Date(booking.customers.updated_at),
    } : undefined,
  }))

  return (
    <>
      <DashboardHeader 
        userEmail={session.user.email || ''} 
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      <DashboardContentRedesigned 
        userEmail={session.user.email || ''}
        agencyName={profile?.agency_name}
        bookings={bookings}
      />
    </>
  )
}

