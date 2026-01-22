import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import CalendarPageRedesigned from '@/app/components/domain/calendar/calendar-view'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import { ensureUserCompany, getUserCompanyId, getUserCompany } from '@/lib/server/data/company-helpers'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Calendar Page - Redesigned
 * 
 * View all pickups and dropoffs with multiple view modes and better organization.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function CalendarRoute() {
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

  // Get user's company_id using helper (more reliable)
  const companyId = await ensureUserCompany(user.id, user.email) || await getUserCompanyId(user.id)
  
  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          userEmail={user.email || ''} 
          agencyName={profileData?.agency_name}
          agencyLogo={profileData?.logo}
        />
        <QuickAccessMenu />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <CalendarPageRedesigned initialBookings={[]} />
        </main>
      </div>
    )
  }
  
  // Fetch bookings with car, customer, and location details from Supabase
  // RLS automatically filters by company_id based on auth.uid() and companies.owner_id
  // No manual filtering needed - RLS handles all access control
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      car:cars(
        id,
        make,
        model,
        year,
        license_plate,
        image_url
      ),
      customer:customers(
        id,
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
    .order('start_ts', { ascending: true })
  
  // Log errors for debugging
  if (bookingsError) {
    console.error('[CalendarPage] Error fetching bookings:', {
      message: bookingsError.message,
      code: bookingsError.code,
      details: bookingsError.details,
      hint: bookingsError.hint
    })
  }
  
  console.log('[CalendarPage] Fetched bookings:', {
    count: bookings?.length || 0
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
          agencyName={profileData?.agency_name}
          agencyLogo={profileData?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <CalendarPageRedesigned initialBookings={bookings || []} />
      </main>
    </div>
  )
}

