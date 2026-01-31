import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import PayoutRequestForm from '@/app/components/domain/payouts/payout-request-form'
import PayoutRequestsList from '@/app/components/domain/payouts/payout-requests-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import Breadcrumbs from '@/app/components/ui/navigation/breadcrumbs'
import { PayoutRequest } from '@/types/payout'
import { getUserCompanyId, getCompanyById } from '@/lib/server/data/company'
import { getBalanceAction } from '@/lib/server/data/payouts'

// Force dynamic rendering - this page uses Supabase auth (cookies)
export const dynamic = 'force-dynamic'

/**
 * Payout Requests Page
 *
 * Single source of truth: public.payout_requests.
 * Identity: auth.users.id (session). All history filtered by user_id = authenticated_user_id.
 */
export default async function PayoutsRoute() {
  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = await getUserCompanyId(user.id)

  const [companyForProfile, balanceResult, payoutRequestsResult] = await Promise.all([
    companyId ? getCompanyById(companyId) : Promise.resolve(null),
    getBalanceAction(),
    supabase
      .from('payout_requests')
      .select('id, user_id, company_id, invoice_url, amount, description, status, admin_notes, processed_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const profile: { agency_name?: string; logo?: string } | null = companyForProfile
    ? { agency_name: companyForProfile.name || undefined, logo: companyForProfile.logo || undefined }
    : null

  let availableBalance = 0
  let pendingPayoutAmount = 0
  if (balanceResult && 'availableBalance' in balanceResult) {
    availableBalance = balanceResult.availableBalance
    pendingPayoutAmount = balanceResult.pendingPayoutAmount ?? 0
  }

  const { data: dbRequests, error: payoutError } = payoutRequestsResult

  const payoutErrorMessage = payoutError ? payoutError.message : null

  const requests: PayoutRequest[] = (dbRequests ?? []).map((req: Record<string, unknown>) => ({
    id: String(req.id),
    userId: String(req.user_id),
    companyId: req.company_id != null ? String(req.company_id) : null,
    invoiceUrl: String(req.invoice_url ?? ''),
    amount: req.amount != null ? Number(req.amount) : undefined,
    description: req.description != null ? String(req.description) : undefined,
    status: (req.status as PayoutRequest['status']) ?? 'pending',
    adminNotes: req.admin_notes != null ? String(req.admin_notes) : undefined,
    processedAt: req.processed_at ? new Date(req.processed_at as string) : undefined,
    createdAt: new Date(req.created_at as string),
    updatedAt: new Date(req.updated_at as string),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profile?.agency_name}
        agencyLogo={profile?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8 min-w-0 w-full">
        <Breadcrumbs />
        
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Payouts
          </h1>
          <p className="text-sm text-gray-600 mt-2 pl-0 sm:ml-[60px]">Manage your earnings and request payouts</p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Balance Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Available Balance Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-green-900 bg-green-100 px-3 py-1 rounded-full">Available</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">€{availableBalance.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Ready to withdraw</p>
              </div>
            </div>

            {/* Pending Payout Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">€{pendingPayoutAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Being processed</p>
              </div>
            </div>

            {/* Request Payout Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <div className="relative flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-2">Request Payout</p>
                <p className="text-sm text-gray-600 mb-4 flex-1">Withdraw your available balance</p>
                <PayoutRequestForm availableBalance={availableBalance} />
              </div>
            </div>
          </div>

          {availableBalance === 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">No balance available</p>
                <p className="text-sm text-blue-700 mt-0.5">Complete bookings to earn and request payouts</p>
              </div>
            </div>
          )}

          {/* Payout History */}
          <PayoutRequestsList initialRequests={requests} errorMessage={payoutErrorMessage} />
        </div>
      </main>
    </div>
  )
}

