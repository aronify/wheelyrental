import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import CalendarPageRedesigned from './components/CalendarPageRedesigned'
import DashboardHeader from '../dashboard/components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'

/**
 * Calendar Page - Redesigned
 * 
 * View all pickups and dropoffs with multiple view modes and better organization.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function CalendarRoute() {
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
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(*),
      customer:customers(*)
    `)
    .eq('owner_id', session.user.id)
    .order('pickup_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={session.user.email || ''} 
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <CalendarPageRedesigned initialBookings={bookings || []} />
      </main>
    </div>
  )
}

