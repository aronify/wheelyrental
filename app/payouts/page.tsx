import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabaseClient'
import PayoutRequestForm from './components/PayoutRequestForm'
import PayoutRequestsList from './components/PayoutRequestsList'
import DashboardHeader from '../dashboard/components/DashboardHeader'
import QuickAccessMenu from '../components/QuickAccessMenu'
import Breadcrumbs from '../components/Breadcrumbs'
import { PayoutRequest } from '@/types/payout'

/**
 * Payout Requests Page
 * 
 * Allows users to submit payout requests by uploading invoices.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function PayoutsRoute() {
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

  // Fetch payout requests
  const { data: dbRequests } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Convert snake_case to camelCase
  const requests: PayoutRequest[] = (dbRequests || []).map((req: any) => ({
    id: req.id,
    userId: req.user_id,
    invoiceUrl: req.invoice_url,
    amount: req.amount ? parseFloat(req.amount) : undefined,
    description: req.description,
    status: req.status,
    adminNotes: req.admin_notes,
    processedAt: req.processed_at ? new Date(req.processed_at) : undefined,
    createdAt: new Date(req.created_at),
    updatedAt: new Date(req.updated_at),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Breadcrumbs />
        <div className="space-y-8">
          <PayoutRequestForm />
          <PayoutRequestsList initialRequests={requests} />
        </div>
      </main>
    </div>
  )
}

