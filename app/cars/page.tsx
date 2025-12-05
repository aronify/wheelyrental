import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import CarsPageRedesigned from './components/CarsPageRedesigned'
import DashboardHeader from '../dashboard/components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'

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

  // Fetch cars from Supabase
  const { data: dbCars } = await supabase
    .from('cars')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Convert snake_case to camelCase
  const cars = (dbCars || []).map(car => ({
    id: car.id,
    ownerId: car.owner_id,
    make: car.make,
    model: car.model,
    year: car.year,
    licensePlate: car.license_plate,
    color: car.color,
    transmission: car.transmission,
    fuelType: car.fuel_type,
    seats: car.seats,
    dailyRate: car.daily_rate,
    status: car.status,
    vin: car.vin,
    imageUrl: car.image_url,
    features: car.features || [],
    createdAt: new Date(car.created_at),
    updatedAt: new Date(car.updated_at),
  }))

  // Fetch profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_name, logo')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <CarsPageRedesigned initialCars={cars} />
      </main>
    </div>
  )
}

