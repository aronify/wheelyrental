import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import LocationsPageRedesigned from '@/app/components/domain/locations/locations-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import { getUserCompanyId, ensureUserCompany } from '@/lib/server/data/company-helpers'
import { getLocationsAction } from '@/lib/server/data/cars-data-actions'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Locations Management Page
 * 
 * Allows users to view, add, edit, and delete locations for their company.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function LocationsRoute() {
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
  const { data: profileData } = await supabase
    .from('profiles')
    .select('agency_name, logo')
    .eq('user_id', user.id)
    .single()

  // Ensure user has a company (create if doesn't exist)
  let companyId = await getUserCompanyId(user.id)
  if (!companyId) {
    companyId = await ensureUserCompany(user.id, user.email)
  }

  // Fetch locations for the user's company
  let initialLocations: any[] = []
  if (companyId) {
    const locationsResult = await getLocationsAction()
    if (locationsResult.locations) {
      initialLocations = locationsResult.locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        city: loc.city,
        addressLine1: loc.addressLine1,
        isPickupLocation: loc.isPickupLocation,
        isDropoffLocation: loc.isDropoffLocation,
        isHq: false, // Will be determined from data if needed
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profileData?.agency_name}
        agencyLogo={profileData?.logo}
      />
      <QuickAccessMenu />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <LocationsPageRedesigned initialLocations={initialLocations} />
      </main>
    </div>
  )
}


