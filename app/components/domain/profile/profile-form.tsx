'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { Profile, ProfileFormData } from '@/types/profile'
import { updateProfileAction } from '@/lib/server/data/profile'
import Breadcrumbs from '@/app/components/ui/navigation/breadcrumbs'
import { ToastSave } from '@/app/components/ui/toast-save'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit,
  CheckCircle,
  AlertCircle,
  Camera,
  Calendar,
} from 'lucide-react'

interface ProfilePageProps {
  initialProfile: Profile
}

export default function ProfilePageRedesigned({ initialProfile }: ProfilePageProps) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toastState, setToastState] = useState<'initial' | 'loading' | 'success'>('initial')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [logoPreview, setLogoPreview] = useState<string>(initialProfile.logo || '')
  
  const [formData, setFormData] = useState<ProfileFormData>({
    agencyName: initialProfile.agencyName,
    description: initialProfile.description,
    email: initialProfile.email,
    phone: initialProfile.phone,
    address: initialProfile.address,
    city: initialProfile.city,
    country: initialProfile.country,
    postalCode: initialProfile.postalCode,
    website: initialProfile.website || '',
    taxId: initialProfile.taxId || '',
    logoUrl: initialProfile.logo || '',
  })

  // Update formData when initialProfile changes (e.g., after save)
  useEffect(() => {
    setFormData({
      agencyName: initialProfile.agencyName,
      description: initialProfile.description,
      email: initialProfile.email,
      phone: initialProfile.phone,
      address: initialProfile.address,
      city: initialProfile.city,
      country: initialProfile.country,
      postalCode: initialProfile.postalCode,
      website: initialProfile.website || '',
      taxId: initialProfile.taxId || '',
      logoUrl: initialProfile.logo || '',
    })
    setLogoPreview(initialProfile.logo || '')
  }, [initialProfile])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrorMessage('')
  }

  const handleSave = async () => {
    setToastState('loading')
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const result = await updateProfileAction({ ...formData, logoUrl: logoPreview })

    if (result.success) {
      setToastState('success')
      setSuccessMessage(t.profileUpdated || 'Profile updated successfully!')
      setTimeout(() => {
        setToastState('initial')
        setSuccessMessage('')
        setIsEditing(false)
        window.location.reload()
      }, 2000)
    } else {
      setToastState('initial')
      setErrorMessage(result.error || t.profileUpdateFailed || 'Failed to update profile')
    }

    setIsSaving(false)
  }

  const handleCancel = () => {
    setFormData({
      agencyName: initialProfile.agencyName,
      description: initialProfile.description,
      email: initialProfile.email,
      phone: initialProfile.phone,
      address: initialProfile.address,
      city: initialProfile.city,
      country: initialProfile.country,
      postalCode: initialProfile.postalCode,
      website: initialProfile.website || '',
      taxId: initialProfile.taxId || '',
      logoUrl: initialProfile.logo || '',
    })
    setLogoPreview(initialProfile.logo || '')
    setIsEditing(false)
    setToastState('initial')
    setErrorMessage('')
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLogoFile(file)
    }
  }

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Logo must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
      setErrorMessage('')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoPreview('')
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Notification: ToastSave when editing (fixed position) */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">
          <ToastSave
            state={toastState}
            onReset={handleCancel}
            onSave={handleSave}
            loadingText={t.saving || 'Saving'}
            successText={t.profileUpdated || 'Changes saved'}
            initialText={t.unsavedChanges || 'Unsaved changes'}
            resetText={t.cancelEdit || 'Reset'}
            saveText={t.saveProfile || 'Save'}
          />
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden shadow-lg ring-2 sm:ring-4 ring-blue-100">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Agency Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-white" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            {/* Agency Info */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">
                {formData.agencyName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{formData.email}</span>
              </p>
            </div>
          </div>

          {/* Action: Edit button when not editing; "Editing" label when editing (Save/Reset in notification) */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t.editProfile || 'Edit Profile'}
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-500">
                {t.editingProfile || 'Editing profile'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 animate-slide-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - General Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agency Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.agencyDetails || 'Agency Details'}
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.agencyName || 'Agency Name'} <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.agencyName}
                    onChange={(e) => handleInputChange('agencyName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter your agency name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formData.agencyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.agencyDescription || 'Description'}
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Describe your rental agency, services, and what makes you special..."
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {formData.description || <span className="text-gray-400">No description provided</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.contactDetails || 'Contact Information'}
              </h2>
            </div>

            <div className="space-y-5">
              {/* Email and Phone - Side by Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.email || 'Email'} <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      {/* Flexbox layout for icon + input */}
                      <div className="flex items-center gap-3 border-2 border-gray-200 rounded-lg bg-gray-50 px-3 py-3">
                        <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          readOnly
                          className="flex-1 bg-transparent text-gray-600 cursor-not-allowed outline-none border-none"
                          placeholder="contact@agency.com"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p>{formData.email}</p>
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.phone || 'Phone'} <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      {/* Flexbox layout for icon + input */}
                      <div className={`flex items-center gap-3 border-2 rounded-lg px-3 py-3 transition-all ${
                        initialProfile.phone && initialProfile.phone.trim() !== ''
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
                      }`}>
                        <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!!initialProfile.phone && initialProfile.phone.trim() !== ''}
                          readOnly={!!initialProfile.phone && initialProfile.phone.trim() !== ''}
                          className={`flex-1 bg-transparent outline-none border-none ${
                            initialProfile.phone && initialProfile.phone.trim() !== ''
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-900'
                          }`}
                          placeholder="+355 69 123 4567"
                        />
                      </div>
                      {initialProfile.phone && initialProfile.phone.trim() !== '' && (
                        <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed once set</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p>{formData.phone || <span className="text-gray-400">Not set</span>}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.address || 'Address'}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Street address"
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-gray-900">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p>{formData.address || <span className="text-gray-400">No address provided</span>}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.city || 'City'}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="City"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.city || <span className="text-gray-400">-</span>}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.postalCode || 'Postal Code'}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="1001"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.postalCode || <span className="text-gray-400">-</span>}</p>
                  )}
                </div>
              </div>

              {formData.country && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.country || 'Country'}
                  </label>
                  <p className="text-gray-900">{formData.country}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Business Information & Stats */}
        <div className="space-y-6">
          {/* Business Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.businessInformation || 'Business Information'}
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.taxId || 'Tax ID'}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Tax ID / Registration Number"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900">{formData.taxId || <span className="text-gray-400">No tax ID provided</span>}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Account Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(initialProfile.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Account Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(initialProfile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
