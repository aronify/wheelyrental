import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import BookingsPageRedesigned from '@/app/components/domain/bookings/bookings-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'

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

  // Fetch profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_name, logo')
    .eq('user_id', user.id)
    .single()

  // Get user's company_id from their cars
  const { data: userCar } = await supabase
    .from('cars')
    .select('company_id')
    .limit(1)
    .single()
  
  const companyId = userCar?.company_id
  
  if (!companyId) {
    // User has no company yet
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          userEmail={user.email || ''}
          agencyName={profile?.agency_name}
          agencyLogo={profile?.logo}
        />
        <QuickAccessMenu />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <BookingsPageRedesigned initialBookings={[]} />
        </main>
      </div>
    )
  }
  
  // Fetch bookings with car, customer, and location details from Supabase
  // Bookings are company-scoped (bookings.company_id is required)
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(
        id,
        make,
        model,
        year,
        license_plate,
        image_url,
        daily_rate
      ),
      customer:customers(
        id,
        full_name,
        phone
      ),
      pickup_location:company_locations!pickup_location_id(
        id,
        name,
        address_line_1,
        city
      ),
      dropoff_location:company_locations!dropoff_location_id(
        id,
        name,
        address_line_1,
        city
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userEmail={user.email || ''}
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <BookingsPageRedesigned initialBookings={bookings || []} />
      </main>
    </div>
  )
}

