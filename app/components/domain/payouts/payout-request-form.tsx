'use client'

import { useState, FormEvent, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { submitPayoutRequestAction } from '@/lib/server/data/payouts-data-actions'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, CheckCircle, AlertCircle, DollarSign, FileCheck } from 'lucide-react'

export default function PayoutRequestForm() {
  const router = useRouter()
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!invoiceFile) {
      setError('Please upload an invoice file')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('invoice', invoiceFile)
      if (amount) {
        formData.append('amount', amount)
      }
      if (description) {
        formData.append('description', description)
      }

      const result = await submitPayoutRequestAction(formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
      } else if (result.success) {
        setSuccess(true)
        // Reset form
        setInvoiceFile(null)
        setInvoicePreview(null)
        setAmount('')
        setDescription('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsSubmitting(false)
        
        // Refresh the page to show the new request in the list
        router.refresh()
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000)
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 animate-slide-in-top">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
          <div className="flex-1">
            <p className="font-semibold">{t.payoutRequestSubmitted || 'Payout request submitted successfully!'}</p>
            <p className="text-green-600 text-xs mt-1">{t.payoutRequestSuccess || 'Your request is being reviewed. You will be notified once it\'s processed.'}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 animate-slide-in-top">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.requestPayout || 'Request Payout'}</h2>
              <p className="text-sm text-gray-600">{t.uploadYourInvoice || 'Upload your invoice to request a payout'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t.invoice || 'Invoice'} <span className="text-red-500">*</span>
            </label>
            {invoiceFile ? (
              <div className="space-y-3">
                <div className="relative border-2 border-green-200 rounded-xl p-4 bg-green-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{invoiceFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Image Preview */}
                  {invoicePreview && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={invoicePreview}
                        alt={t.invoicePreview || 'Invoice preview'}
                        className="w-full h-auto max-h-64 object-contain bg-gray-50"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t.changeFile || 'Change file'}
                </button>
              </div>
            ) : (
              <label
                htmlFor="invoice-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    <span className="text-blue-600">{t.clickToUpload || 'Click to upload'}</span> {t.orDragAndDrop || 'or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500">{t.acceptedFormatsMax || 'PDF, JPG, or PNG (MAX. 10MB)'}</p>
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

          {/* Amount (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t.payoutAmount || 'Amount'} (€) <span className="text-gray-400 text-xs font-normal">{t.optional || '(Optional)'}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-gray-900 placeholder-gray-400 bg-white hover:border-blue-300 min-h-[44px] text-base sm:text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{t.enterPayoutAmount || 'Enter the payout amount if specified in your invoice'}</p>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t.payoutDescription || 'Description'} <span className="text-gray-400 text-xs font-normal">{t.optional || '(Optional)'}</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.addAdditionalNotes || 'Add any additional notes or details about this payout request...'}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-gray-900 placeholder-gray-400 bg-white hover:border-blue-300 resize-none min-h-[44px] text-base sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !invoiceFile}
              className="flex-1 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white py-4 px-6 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group min-h-[44px]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.submitting || 'Submitting...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    {t.submitPayoutRequest || 'Submit Payout Request'}
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">{t.importantInformation || 'Important Information'}</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>{t.ensureInvoiceClear || 'Please ensure your invoice is clear and readable'}</li>
              <li>{t.acceptedFormatsInfo || 'Accepted formats: PDF, JPG, PNG (max 10MB)'}</li>
              <li>{t.requestReviewedProcessed || 'Your request will be reviewed and processed within 3-5 business days'}</li>
              <li>{t.receiveNotification || 'You will receive a notification once your payout is processed'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

