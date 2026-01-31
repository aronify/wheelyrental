import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import LocationsPageRedesigned from '@/app/components/domain/locations/locations-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import NoCompanyAlert from '@/app/components/ui/alerts/no-company-alert'
import { getUserCompanyId, getCompanyById } from '@/lib/server/data/company'
import { getLocationsAction } from '@/lib/server/data/cars'

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

  const companyId = await getUserCompanyId(user.id)

  const [companyForProfile, locationsResult] = await Promise.all([
    companyId ? getCompanyById(companyId) : Promise.resolve(null),
    companyId ? getLocationsAction() : Promise.resolve({ locations: [], error: undefined }),
  ])

  const profileData: { agency_name?: string; logo?: string } | null = companyForProfile
    ? { agency_name: companyForProfile.name || undefined, logo: companyForProfile.logo || undefined }
    : null

  let initialLocations: any[] = []
  if (companyId && locationsResult.locations) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profileData?.agency_name}
        agencyLogo={profileData?.logo}
      />
      <QuickAccessMenu />
      <main className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 min-w-0 w-full">
        {/* Show alert if no company - non-blocking */}
        {!companyId && <NoCompanyAlert />}
        
        {/* Always show locations page */}
        <LocationsPageRedesigned initialLocations={initialLocations} />
      </main>
    </div>
  )
}


