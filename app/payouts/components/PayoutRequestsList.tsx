'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PayoutRequest, PayoutRequestStatus } from '@/types/payout'
import { getPayoutRequestsAction, getInvoiceSignedUrlAction } from '../actions'
import { FileText, Clock, CheckCircle, XCircle, DollarSign, Calendar, ExternalLink, AlertCircle, X, Download } from 'lucide-react'

interface PayoutRequestsListProps {
  initialRequests: PayoutRequest[]
}

export default function PayoutRequestsList({ initialRequests }: PayoutRequestsListProps) {
  const { t } = useLanguage()
  const [requests, setRequests] = useState<PayoutRequest[]>(initialRequests)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<{ url: string; fileName: string } | null>(null)
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)

  const getStatusColor = (status: PayoutRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'processed':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: PayoutRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'processed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: PayoutRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'approved':
        return 'Approved'
      case 'confirmed':
        return 'Confirmed'
      case 'rejected':
        return 'Rejected'
      case 'processed':
        return 'Processed'
      default:
        return status
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  const refreshRequests = async () => {
    setIsLoading(true)
    try {
      const result = await getPayoutRequestsAction()
      if (result.success && result.data) {
        const dbRequests = (result.data as any[]).map((req: any) => ({
          id: req.id,
          userId: req.user_id,
          invoiceUrl: req.invoice_url,
          amount: req.amount ? parseFloat(req.amount) : undefined,
          description: req.description,
          status: req.status as PayoutRequestStatus,
          adminNotes: req.admin_notes,
          processedAt: req.processed_at ? new Date(req.processed_at) : undefined,
          createdAt: new Date(req.created_at),
          updatedAt: new Date(req.updated_at),
        }))
        setRequests(dbRequests)
      }
    } catch (error) {
      console.error('Failed to refresh requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Only refresh if we want to manually refresh, not on mount since we have initialRequests

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noPayoutRequestsYet || 'No payout requests yet'}</h3>
        <p className="text-sm text-gray-600">{t.submitFirstRequest || 'Submit your first payout request above to get started.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{t.yourPayoutRequests || 'Your Payout Requests'}</h2>
        <button
          onClick={refreshRequests}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? (t.loading || 'Refreshing...') : (t.refresh || 'Refresh')}
        </button>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: Request Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {t.requestPayout || 'Payout Request'}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                      {request.amount && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-gray-900">€{request.amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {request.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.description}</p>
                    )}

                    {request.adminNotes && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-yellow-900 mb-1">{t.adminNote || 'Admin Note'}:</p>
                            <p className="text-sm text-yellow-800">{request.adminNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.processedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        {t.processed || 'Processed'}: {formatDate(request.processedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <button
                  onClick={async () => {
                    setIsLoadingInvoice(true)
                    const result = await getInvoiceSignedUrlAction(request.invoiceUrl)
                    if (result.success && result.url) {
                      // Extract filename from path
                      const fileName = request.invoiceUrl.split('/').pop() || 'invoice'
                      setSelectedInvoice({ url: result.url, fileName })
                    } else {
                      alert('Failed to load invoice. Please try again.')
                    }
                    setIsLoadingInvoice(false)
                  }}
                  disabled={isLoadingInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingInvoice ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.loading || 'Loading...'}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {t.viewInvoice || 'View Invoice'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice View Modal */}
      {selectedInvoice && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setSelectedInvoice(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start sm:items-center justify-center p-0 sm:p-4">
              <div
                className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-screen sm:max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">{t.invoice || 'Invoice'}</h3>
                      <p className="text-blue-100 text-xs sm:text-sm truncate">{selectedInvoice.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedInvoice.url}
                      download={selectedInvoice.fileName}
                      className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                      title={t.download || 'Download'}
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto max-h-[calc(100vh-120px)] sm:max-h-[calc(90vh-120px)]">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    {selectedInvoice.url.endsWith('.pdf') || selectedInvoice.url.includes('application/pdf') ? (
                      <iframe
                        src={selectedInvoice.url}
                        className="w-full h-[calc(100vh-200px)] sm:h-[calc(90vh-200px)] min-h-[500px]"
                        title="Invoice PDF"
                      />
                    ) : (
                      <div className="flex items-center justify-center p-4">
                        <img
                          src={selectedInvoice.url}
                          alt="Invoice"
                          className="max-w-full max-h-[calc(100vh-200px)] sm:max-h-[calc(90vh-200px)] object-contain rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const unableToDisplay = t.unableToDisplayInvoice || 'Unable to display invoice image.'
                              const downloadInvoice = t.downloadInvoice || 'Download Invoice'
                              parent.innerHTML = `
                                <div class="text-center p-8">
                                  <p class="text-gray-600 mb-4">${unableToDisplay}</p>
                                  <a href="${selectedInvoice.url}" download="${selectedInvoice.fileName}" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    ${downloadInvoice}
                                  </a>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

