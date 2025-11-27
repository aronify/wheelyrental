'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Car, CarFormData, TransmissionType, FuelType, CarStatus } from '@/types/car'

interface CarFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CarFormData) => void
  car?: Car | null
  mode: 'add' | 'edit'
}

export default function CarFormModal({ isOpen, onClose, onSubmit, car, mode }: CarFormModalProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CarFormData>({
    make: car?.make || '',
    model: car?.model || '',
    year: car?.year || new Date().getFullYear(),
    licensePlate: car?.licensePlate || '',
    color: car?.color || '',
    transmission: car?.transmission || 'automatic',
    fuelType: car?.fuelType || 'petrol',
    seats: car?.seats || 5,
    dailyRate: car?.dailyRate || 0,
    imageUrl: car?.imageUrl || '',
    status: car?.status || 'available',
    vin: car?.vin || '',
    insuranceExpiry: car?.insuranceExpiry,
    description: car?.description || '',
    features: car?.features || [],
  })

  const [newFeature, setNewFeature] = useState('')
  const [imagePreview, setImagePreview] = useState<string>(car?.imageUrl || '')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Update form data when car prop changes (edit mode)
  useEffect(() => {
    if (isOpen) {
      if (car) {
        // Editing existing car
        setFormData({
          make: car.make || '',
          model: car.model || '',
          year: car.year || new Date().getFullYear(),
          licensePlate: car.licensePlate || '',
          color: car.color || '',
          transmission: car.transmission || 'automatic',
          fuelType: car.fuelType || 'petrol',
          seats: car.seats || 5,
          dailyRate: car.dailyRate || 0,
          imageUrl: car.imageUrl || '',
          status: car.status || 'available',
          vin: car.vin || '',
          insuranceExpiry: car.insuranceExpiry,
          description: car.description || '',
          features: car.features || [],
        })
        setImagePreview(car.imageUrl || '')
      } else {
        // Adding new car - reset form
        setFormData({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          color: '',
          transmission: 'automatic',
          fuelType: 'petrol',
          seats: 5,
          dailyRate: 0,
          imageUrl: '',
          status: 'available',
          vin: '',
          insuranceExpiry: undefined,
          description: '',
          features: [],
        })
        setImagePreview('')
      }
      setNewFeature('')
      setUploadError('')
    }
  }, [isOpen, car])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      })
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }

  const [uploadError, setUploadError] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear any previous errors
    setUploadError('')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG, JPG, WEBP)')
      setTimeout(() => setUploadError(''), 4000)
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB')
      setTimeout(() => setUploadError(''), 4000)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData({ ...formData, imageUrl: base64String })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    setFormData({ ...formData, imageUrl: '' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {mode === 'add' ? t.addCar : t.editCar}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Make (Brand) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.brand} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Toyota"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.model} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Corolla"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.year} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* License Plate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.plateNumber} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC-1234"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.color} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., White"
                  />
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.transmission} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value as TransmissionType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="automatic">{t.automatic}</option>
                    <option value="manual">{t.manual}</option>
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.fuelType} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="petrol">{t.petrol}</option>
                    <option value="diesel">{t.diesel}</option>
                    <option value="electric">{t.electric}</option>
                    <option value="hybrid">{t.hybrid}</option>
                  </select>
                </div>

                {/* Seats */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.seats} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="2"
                    max="9"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Daily Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.dailyRate} (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.status} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CarStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">{t.statusAvailable}</option>
                    <option value="rented">{t.statusRented}</option>
                    <option value="maintenance">{t.statusMaintenance}</option>
                    <option value="inactive">{t.statusInactive}</option>
                  </select>
                </div>

                {/* Car Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Car Image <span className="text-red-500">*</span>
                  </label>
                  
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={imagePreview}
                          alt="Car preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('car-image-input')?.click()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-700 font-medium">
                          <span className="text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                      </div>
                      <input
                        id="car-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  
                  {uploadError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {uploadError}
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-gray-500">
                    Upload a clear photo of the car. This will be the main image customers see.
                  </p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.description}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the car..."
                  />
                </div>

                {/* Features */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.features}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Air Conditioning"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="hover:text-blue-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : mode === 'add' ? t.save : t.update}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


