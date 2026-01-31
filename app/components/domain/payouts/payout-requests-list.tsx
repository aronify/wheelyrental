'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { PayoutRequest, PayoutRequestStatus } from '@/types/payout'
import { getPayoutRequestsAction, getInvoiceSignedUrlAction } from '@/lib/server/data/payouts'
import { FileText, Download, X } from 'lucide-react'

interface PayoutRequestsListProps {
  initialRequests: PayoutRequest[]
  errorMessage?: string | null
}

/** Semantic status only – low contrast, accounting-style */
const STATUS_STYLES: Record<PayoutRequestStatus, string> = {
  pending: 'bg-gray-100 text-amber-800 border-gray-200',
  approved: 'bg-gray-100 text-green-800 border-gray-200',
  confirmed: 'bg-gray-100 text-green-800 border-gray-200',
  paid: 'bg-gray-100 text-green-800 border-gray-200',
  processed: 'bg-gray-100 text-green-800 border-gray-200',
  rejected: 'bg-gray-100 text-red-800 border-gray-200',
}

function getStatusStyle(status: PayoutRequestStatus): string {
  return STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

function getStatusLabel(status: PayoutRequestStatus): string {
  const labels: Record<PayoutRequestStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    confirmed: 'Confirmed',
    paid: 'Paid',
    processed: 'Processed',
    rejected: 'Rejected',
  }
  return labels[status] ?? status
}

/** Validate invoice URL before linking: non-empty and not placeholder */
function isViewableInvoiceUrl(invoiceUrl: string): boolean {
  const u = (invoiceUrl ?? '').trim()
  return u.length > 0 && u !== 'none'
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export default function PayoutRequestsList({ initialRequests, errorMessage }: PayoutRequestsListProps) {
  const { t } = useLanguage()
  const [requests, setRequests] = useState<PayoutRequest[]>(initialRequests)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<{
    url: string
    fileName: string
    path: string
  } | null>(null)
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)

  const refreshRequests = async () => {
    setIsLoading(true)
    try {
      const result = await getPayoutRequestsAction()
      if (result.error) {
        setRequests([])
        return
      }
      if (result.success && result.data) {
        const rows = (result.data as any[]).map((req: any) => ({
          id: req.id,
          userId: req.user_id,
          companyId: req.company_id ?? null,
          invoiceUrl: req.invoice_url ?? '',
          amount: req.amount != null ? parseFloat(req.amount) : undefined,
          description: req.description ?? undefined,
          status: (req.status as PayoutRequestStatus) ?? 'pending',
          adminNotes: req.admin_notes ?? undefined,
          processedAt: req.processed_at ? new Date(req.processed_at) : undefined,
          createdAt: new Date(req.created_at),
          updatedAt: new Date(req.updated_at),
        }))
        setRequests(rows)
      }
    } catch {
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  if (errorMessage) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-red-600">{errorMessage}</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-600">{t.noPayoutRequestsYet ?? 'No payout requests.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          Payout History
        </h2>
        <button
          type="button"
          onClick={refreshRequests}
          disabled={isLoading}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? (t.loading ?? 'Loading…') : (t.refresh ?? 'Refresh')}
        </button>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
        <div className="overflow-x-auto -mx-0 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-700">Date requested</th>
                <th className="px-4 py-3 font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Processed</th>
                <th className="px-4 py-3 font-medium text-gray-700">Invoice</th>
                <th className="px-4 py-3 font-medium text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && requests.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3"><span className="inline-block h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><span className="inline-block h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><span className="inline-block h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><span className="inline-block h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><span className="inline-block h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><span className="inline-block h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-600">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {request.amount != null && request.amount >= 0 ? `€${request.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${getStatusStyle(request.status)}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {request.processedAt ? formatDate(request.processedAt) : 'Not processed'}
                    </td>
                    <td className="px-4 py-3">
                      {isViewableInvoiceUrl(request.invoiceUrl) ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setIsLoadingInvoice(true)
                            const result = await getInvoiceSignedUrlAction(request.invoiceUrl)
                            if (result.success && result.url) {
                              const fileName = request.invoiceUrl.split('/').pop() || 'invoice'
                              setSelectedInvoice({
                                url: result.url,
                                fileName,
                                path: request.invoiceUrl,
                              })
                            }
                            setIsLoadingInvoice(false)
                          }}
                          disabled={isLoadingInvoice}
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50 underline underline-offset-2"
                        >
                          {t.viewInvoice ?? 'View invoice'}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                      {request.description != null && request.description.trim() !== '' && (
                        <span className="block text-gray-700">{request.description}</span>
                      )}
                      {request.adminNotes != null && request.adminNotes.trim() !== '' && (
                        <span className="block text-gray-600 mt-0.5">
                          <span className="text-gray-500">{t.adminNote ?? 'Admin'}: </span>
                          {request.adminNotes}
                        </span>
                      )}
                      {(!request.description || request.description.trim() === '') &&
                        (!request.adminNotes || request.adminNotes.trim() === '') && (
                          <span className="text-gray-400">—</span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            aria-hidden
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">{selectedInvoice.fileName}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={selectedInvoice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    title={t.download ?? 'Open in new tab'}
                  >
                    <Download className="h-4 w-4" />
                    {t.download ?? 'Open in new tab'}
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-50 min-h-[200px]">
                {selectedInvoice.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`/api/payouts/invoice?path=${encodeURIComponent(selectedInvoice.path)}`}
                    className="w-full h-[70vh] border border-gray-200 rounded-lg"
                    title="Invoice"
                  />
                ) : (
                  <img
                    src={`/api/payouts/invoice?path=${encodeURIComponent(selectedInvoice.path)}`}
                    alt="Invoice"
                    className="max-w-full h-auto rounded-lg border border-gray-200 mx-auto block"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
