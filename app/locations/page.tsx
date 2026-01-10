import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import LocationsPageRedesigned from '@/app/components/domain/locations/locations-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import { getUserCompanyId, getUserCompany } from '@/lib/server/data/company-helpers'
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

  // Get user's company ID - DO NOT create automatically
  const companyId = await getUserCompanyId(user.id)

  // Fetch locations for the user's company (only if company exists)
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
        isHq: false, // Will be determined from data if needed,
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
        {/* Show alert if no company - non-blocking */}
        {!companyId && <NoCompanyAlert />}
        
        {/* Always show locations page */}
        <LocationsPageRedesigned initialLocations={initialLocations} />
      </main>
    </div>
  )
}


