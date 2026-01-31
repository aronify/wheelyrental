'use client'

import { useState, FormEvent, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { submitPayoutRequestAction, submitPayoutFromBalanceAction } from '@/lib/server/data/payouts'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, CheckCircle, AlertCircle, DollarSign, FileCheck } from 'lucide-react'

interface PayoutRequestFormProps {
  availableBalance?: number
}

export default function PayoutRequestForm({ availableBalance = 0 }: PayoutRequestFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null)
  const [amount, setAmount] = useState(availableBalance.toFixed(2))
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const amountNum = parseFloat(amount) || 0
  const canSubmitBalance = amountNum > 0 && amountNum <= availableBalance && !isSubmitting
  const exceedsBalance = amountNum > availableBalance && availableBalance >= 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, JPG, or PNG file.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 10MB.')
      return
    }

    setError(null)
    setInvoiceFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setInvoicePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setInvoicePreview(null)
    }
  }

  const handleRemoveFile = () => {
    setInvoiceFile(null)
    setInvoicePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError(null)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      setAmount('')
      return
    }
    const num = parseFloat(raw)
    if (Number.isNaN(num) || num < 0) {
      setAmount('')
      return
    }
    if (availableBalance >= 0 && num > availableBalance) {
      setAmount(availableBalance.toFixed(2))
      return
    }
    setAmount(raw)
  }

  const handleOpenModal = () => {
    setAmount(availableBalance.toFixed(2))
    setDescription('')
    setInvoiceFile(null)
    setInvoicePreview(null)
    setError(null)
    setSuccess(false)
    setIsOpen(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const num = parseFloat(amount) || 0
    if (num <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    if (num > availableBalance) {
      setError('Payout exceeds available balance.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('amount', amount)
      if (description) formData.append('description', description)
      if (invoiceFile && invoiceFile.size > 0) formData.append('invoice', invoiceFile)

      const result = await submitPayoutFromBalanceAction(formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
      } else if (result.success) {
        setSuccess(true)
        setInvoiceFile(null)
        setInvoicePreview(null)
        setAmount('')
        setDescription('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        setIsSubmitting(false)
        router.refresh()
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
        }, 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const canRequest = availableBalance > 0 && !isSubmitting

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={!canRequest}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl px-6 py-3 text-sm font-bold shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
      >
        {availableBalance > 0 ? 'Request Payout' : 'No Balance Available'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            aria-hidden
            onClick={() => !isSubmitting && setIsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Request Payout</h2>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6 bg-gray-50">
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 mb-4">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-semibold">Request submitted</p>
                      <p className="text-green-600 text-xs mt-0.5">Your payout request has been received.</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                    <span className="flex-1">{error}</span>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Amount (required for balance payout) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Amount (€)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={availableBalance}
                        step="0.01"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-gray-900 placeholder-gray-400 bg-white disabled:bg-gray-100 disabled:opacity-70"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Maximum: €{availableBalance.toFixed(2)}
                    </p>
                    {exceedsBalance && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Amount exceeds available balance
                      </p>
                    )}
                  </div>

                  {/* Invoice Upload (optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Invoice <span className="text-gray-500 text-xs font-normal">(optional)</span>
                    </label>
                    {invoiceFile ? (
                      <div className="space-y-2">
                        <div className="relative border-2 border-green-200 rounded-xl p-4 bg-green-50">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{invoiceFile.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Change file
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="invoice-upload"
                        className="flex flex-col items-center justify-center w-full h-36 border-3 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white"
                      >
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                            <Upload className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            <span className="text-blue-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                        </div>
                        <input
                          id="invoice-upload"
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Description (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-gray-500 text-xs font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add notes or details..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder-gray-400 bg-white resize-none"
                    />
                  </div>

                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)}
                  disabled={!canSubmitBalance}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl text-sm font-bold hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

