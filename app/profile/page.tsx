import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import ProfilePageRedesigned from '@/app/components/domain/profile/profile-form'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import { getUserCompanyId, getUserCompany, ensureUserCompany } from '@/lib/server/data/company'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Profile Page - Redesigned
 * 
 * Allows users to view and edit their rental agency profile with a modern UI.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function ProfileRoute() {
  const supabase = await createServerComponentClient()
  
  // Check authentication using getUser() for security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Fetch company data from companies table (not profiles)
  // First, get user's company_id
  let companyId = await getUserCompanyId(user.id)
  
  let profileData
  if (companyId) {
    // Fetch company data
    const company = await getUserCompany(user.id)
    if (company) {
      profileData = company
    }
  }
  
  // If no company exists, ensure one is created
  if (!profileData || !companyId) {
    companyId = await ensureUserCompany(user.id, user.email)
    if (companyId) {
      const company = await getUserCompany(user.id)
      if (company) {
        profileData = company
      }
    }
  }

  // Convert snake_case to camelCase for the component
  // Map companies table fields to Profile interface
  const profile = {
    id: profileData?.id || '',
    userId: user.id,
    agencyName: profileData?.name || '',
    description: profileData?.description || '',
    email: profileData?.email || user.email || '',
    phone: profileData?.phone || '',
    address: profileData?.address || '',
    city: profileData?.city || '',
    country: profileData?.country || '',
    postalCode: profileData?.postal_code || '',
    website: profileData?.website || '',
    taxId: profileData?.tax_id || '',
    logo: profileData?.logo || '',
    createdAt: profileData?.created_at ? new Date(profileData.created_at) : new Date(),
    updatedAt: profileData?.updated_at ? new Date(profileData.updated_at) : new Date(),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profile.agencyName}
        agencyLogo={profile.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <ProfilePageRedesigned initialProfile={profile} />
      </main>
    </div>
  )
}

