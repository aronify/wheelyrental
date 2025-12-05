import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import ProfilePageRedesigned from './components/ProfilePageRedesigned'
import DashboardHeader from '../dashboard/components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'

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

  // Fetch profile from Supabase
  const { data: dbProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no profile exists, create a default one
  let profileData
  if (error || !dbProfile) {
    const defaultProfile = {
      user_id: user.id,
      agency_name: 'My Rental Agency',
      description: '',
      email: user.email || '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postal_code: '',
      website: '',
      tax_id: '',
      logo: null, // Database column is 'logo' not 'logo_url'
    }
    
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert(defaultProfile)
      .select()
      .single()
      
    profileData = newProfile || defaultProfile
  } else {
    profileData = dbProfile
  }

  // Convert snake_case to camelCase for the component
  const profile = {
    id: profileData.id,
    userId: profileData.user_id,
    agencyName: profileData.agency_name || '',
    description: profileData.description || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    address: profileData.address || '',
    city: profileData.city || '',
    country: profileData.country || '',
    postalCode: profileData.postal_code || '',
    website: profileData.website || '',
    taxId: profileData.tax_id || '',
    logo: profileData.logo || '', // Database column is 'logo' not 'logo_url'
    createdAt: profileData.created_at,
    updatedAt: profileData.updated_at,
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

