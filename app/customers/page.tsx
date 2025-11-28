import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import CustomersPageRedesigned from './components/CustomersPageRedesigned'
import DashboardHeader from '../dashboard/components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'

/**
 * Customers Page
 * 
 * View and manage all customers.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function CustomersRoute() {
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

  // Fetch customers from Supabase with bookings data
  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select(`
      *,
      bookings (
        id,
        total_price,
        status,
        pickup_date,
        created_at
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  // Debug logging
  console.log('=== CUSTOMERS DEBUG ===')
  console.log('Session user ID:', session.user.id)
  console.log('Customers data:', customersData)
  console.log('Customers error:', customersError)
  console.log('Number of customers:', customersData?.length || 0)

  // Transform data to match Customer type
  const customers = (customersData || []).map((customer: any) => {
    const bookings = customer.bookings || []
    const completedBookings = bookings.filter((b: any) => 
      b.status === 'confirmed' || b.status === 'picked_up' || b.status === 'returned'
    )
    
    const totalSpent = completedBookings.reduce((sum: number, b: any) => 
      sum + (b.total_price || 0), 0
    )
    
    const sortedBookings = [...bookings].sort((a: any, b: any) => 
      new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime()
    )
    
    return {
      id: customer.id,
      name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      dateOfBirth: customer.date_of_birth ? new Date(customer.date_of_birth) : undefined,
      licenseNumber: customer.driver_license,
      licenseExpiryDate: customer.license_expiry ? new Date(customer.license_expiry) : undefined,
      totalBookings: bookings.length,
      totalSpent: totalSpent,
      joinedAt: new Date(customer.created_at),
      lastBookingAt: sortedBookings.length > 0 ? new Date(sortedBookings[0].pickup_date) : undefined,
      notes: customer.notes,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userEmail={session.user.email || ''}
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <CustomersPageRedesigned initialCustomers={customers || []} />
      </main>
    </div>
  )
}

