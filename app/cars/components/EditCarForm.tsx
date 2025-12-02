'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Car, CarFormData, TransmissionType, FuelType, CarStatus } from '@/types/car'
import { X, Save, Image as ImageIcon, Info, Settings, DollarSign, CheckCircle } from 'lucide-react'
import CustomDropdown from '@/app/components/CustomDropdown'

interface EditCarFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CarFormData) => void
  car: Car
}

export default function EditCarForm({ isOpen, onClose, onSubmit, car }: EditCarFormProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'image' | 'details' | 'specs' | 'pricing'>('image')
  const [imagePreviews, setImagePreviews] = useState<string[]>(car.imageUrl ? [car.imageUrl] : [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const statusButtonRef = useRef<HTMLButtonElement>(null)
  const [colorDropdownPosition, setColorDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [statusDropdownPosition, setStatusDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Popular car colors with hex values
  const carColors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Orange', hex: '#EA580C' },
    { name: 'Brown', hex: '#92400E' },
    { name: 'Beige', hex: '#D4A574' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Navy Blue', hex: '#1E3A8A' },
    { name: 'Dark Green', hex: '#14532D' },
    { name: 'Purple', hex: '#7C3AED' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Maroon', hex: '#7F1D1D' },
  ]

  const [formData, setFormData] = useState<CarFormData>({
    make: car.make || '',
    model: car.model || '',
    year: car.year || new Date().getFullYear(),
    licensePlate: car.licensePlate || '',
    color: car.color || '',
    transmission: car.transmission || 'automatic',
    fuelType: car.fuelType || 'petrol',
    seats: car.seats || 5,
    dailyRate: car.dailyRate || 0,
    status: car.status || 'available',
    imageUrl: car.imageUrl || '',
    features: car.features || [],
    vin: car.vin || '',
  })

  // Image compression function
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          let quality = 0.7
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          
          while (compressedDataUrl.length > 800000 && quality > 0.1) {
            quality -= 0.1
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          }

          if (compressedDataUrl.length > 1000000) {
            reject(new Error('Image too large. Please use a smaller image.'))
          } else {
            resolve(compressedDataUrl)
          }
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError(t.required || 'Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError(t.required || 'Image is too large. Max 10MB')
      return
    }

    try {
      setImageError(null)
      const compressedBase64 = await compressImage(file)
      // Add to existing images instead of replacing
      setImagePreviews(prev => [...prev, compressedBase64])
      setImageFiles(prev => [...prev, file])
      setFormData({ ...formData, imageUrl: compressedBase64 })
      setHasChanges(true)
    } catch (error: unknown) {
      setImageError(error instanceof Error ? error.message : 'Failed to process image')
    }
  }

  const handleRemoveImageByIndex = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleImageFile(file)
      })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!imagePreviews.length || !imagePreviews[0]) {
      setImageError(t.required || 'Image is required')
      setActiveTab('image')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({ ...formData, imageUrl: imagePreviews[0] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CarFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
    setHasChanges(true)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'image' as const, label: t.image || 'Photo', icon: ImageIcon },
    { id: 'details' as const, label: t.details || 'Details', icon: Info },
    { id: 'specs' as const, label: t.specifications || 'Specs', icon: Settings },
    { id: 'pricing' as const, label: t.pricing || 'Pricing', icon: DollarSign },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-blue-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {t.editCar || 'Edit Vehicle'}
                </h2>
                <p className="text-blue-100 text-xs">
                  {car.make} {car.model} • {car.licensePlate}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-900 shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Vehicle Photo</h3>
                  <p className="text-sm text-gray-600">Update your vehicle's primary image</p>
                </div>

                {/* Current Images Preview */}
                {imagePreviews.length > 0 ? (
                  <div className="space-y-4">
                    {/* Primary Image */}
                    <div className="relative">
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-indigo-300 shadow-lg">
                        <div className="absolute top-3 left-3 px-3 py-1 bg-indigo-900 text-white text-xs font-semibold rounded-full z-10">
                          Primary Photo
                        </div>
                        <img
                          src={imagePreviews[0]}
                          alt="Car preview - Primary"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageByIndex(0)}
                          className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Additional Images Grid */}
                    {imagePreviews.length > 1 && (
                      <div className="grid grid-cols-3 gap-3">
                        {imagePreviews.slice(1).map((preview, index) => (
                          <div key={index + 1} className="relative rounded-lg overflow-hidden border-2 border-gray-300 shadow-md group">
                            <img
                              src={preview}
                              alt={`Car preview ${index + 2}`}
                              className="w-full h-28 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImageByIndex(index + 1)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add More Photos Button */}
                    <label
                      htmlFor="edit-car-image-input"
                      className="w-full px-4 py-3 border-2 border-indigo-900 text-indigo-900 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5" />
                      {imagePreviews.length === 1 ? (t.addMorePhotos || 'Add More Photos') : (t.addAnotherPhoto || 'Add Another Photo')}
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 shadow-lg">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <ImageIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Hidden file input - always rendered */}
                <input
                  id="edit-car-image-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      Array.from(files).forEach(file => {
                        handleImageFile(file)
                      })
                      e.target.value = ''
                    }
                  }}
                  className="hidden"
                />

                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium mb-1 text-sm">
                    {t.dragDropLogo || 'Drop your image here'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.autoCompressed || 'Auto-compressed'}
                  </p>
                </div>

                {imageError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-center">
                    {imageError}
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Vehicle Information</h3>
                  <p className="text-sm text-gray-600">Basic details about your vehicle</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.make || 'MAKE'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      placeholder="e.g. Toyota"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.model || 'MODEL'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="e.g. Camry"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.year || 'YEAR'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="2024"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.licensePlate || 'LICENSE PLATE'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                      placeholder="ABC-1234"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.color || 'COLOR'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        ref={colorButtonRef}
                        type="button"
                        onClick={() => {
                          if (colorButtonRef.current) {
                            const rect = colorButtonRef.current.getBoundingClientRect()
                            setColorDropdownPosition({
                              top: rect.bottom + window.scrollY + 4,
                              left: rect.left + window.scrollX,
                              width: rect.width
                            })
                          }
                          setIsColorDropdownOpen(!isColorDropdownOpen)
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left transition-all text-sm bg-white flex items-center justify-between"
                      >
                        {formData.color ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: carColors.find(c => c.name === formData.color)?.hex }}
                            />
                            {formData.color}
                          </span>
                        ) : (
                          <span className="text-gray-400">Select color</span>
                        )}
                        <svg className={`w-4 h-4 transition-transform ${isColorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {isColorDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[9998]" 
                          onClick={() => setIsColorDropdownOpen(false)}
                        />
                        <div 
                          className="fixed z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
                          style={{
                            top: `${colorDropdownPosition.top}px`,
                            left: `${colorDropdownPosition.left}px`,
                            width: `${colorDropdownPosition.width}px`
                          }}
                        >
                          {carColors.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => {
                                handleInputChange('color', color.name)
                                setIsColorDropdownOpen(false)
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                            >
                              <span
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.vin || 'VIN'}
                    </label>
                    <input
                      type="text"
                      value={formData.vin}
                      onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                      placeholder="17-digit VIN"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Technical Specifications</h3>
                  <p className="text-sm text-gray-600">Engine, transmission, and availability</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.transmission || 'TRANSMISSION'} <span className="text-red-500">*</span>
                    </label>
                    <CustomDropdown
                      value={formData.transmission}
                      onChange={(value) => handleInputChange('transmission', value as TransmissionType)}
                      options={[
                        { value: 'automatic', label: t.automatic || 'Automatic' },
                        { value: 'manual', label: t.manual || 'Manual' },
                      ]}
                      placeholder={t.transmission || 'Select transmission'}
                      required={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.fuelType || 'FUEL TYPE'} <span className="text-red-500">*</span>
                    </label>
                    <CustomDropdown
                      value={formData.fuelType}
                      onChange={(value) => handleInputChange('fuelType', value as FuelType)}
                      options={[
                        { value: 'petrol', label: t.petrol || 'Petrol' },
                        { value: 'diesel', label: t.diesel || 'Diesel' },
                        { value: 'electric', label: t.electric || 'Electric' },
                        { value: 'hybrid', label: t.hybrid || 'Hybrid' },
                      ]}
                      placeholder={t.fuelType || 'Select fuel type'}
                      required={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.seats || 'SEATS'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                      min="2"
                      max="12"
                      placeholder="5"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      {t.status || 'STATUS'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        ref={statusButtonRef}
                        type="button"
                        onClick={() => {
                          if (statusButtonRef.current) {
                            const rect = statusButtonRef.current.getBoundingClientRect()
                            setStatusDropdownPosition({
                              top: rect.bottom + window.scrollY + 4,
                              left: rect.left + window.scrollX,
                              width: rect.width
                            })
                          }
                          setIsStatusDropdownOpen(!isStatusDropdownOpen)
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left transition-all text-sm bg-white flex items-center justify-between"
                      >
                        <span className={`font-medium ${
                          formData.status === 'available' ? 'text-green-600' :
                          formData.status === 'rented' ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {formData.status === 'available' ? (t.statusAvailable || 'Available') :
                           formData.status === 'rented' ? (t.statusRented || 'Rented') :
                           (t.statusMaintenance || 'Maintenance')}
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {isStatusDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[9998]" 
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div 
                          className="fixed z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-2xl"
                          style={{
                            top: `${statusDropdownPosition.top}px`,
                            left: `${statusDropdownPosition.left}px`,
                            width: `${statusDropdownPosition.width}px`
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('status', 'available')
                              setIsStatusDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-sm border-b"
                          >
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-green-600 font-medium">{t.statusAvailable || 'Available'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('status', 'rented')
                              setIsStatusDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm border-b"
                          >
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-blue-600 font-medium">{t.statusRented || 'Rented'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('status', 'maintenance')
                              setIsStatusDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center gap-2 text-sm"
                          >
                            <span className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="text-orange-600 font-medium">{t.statusMaintenance || 'Maintenance'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                    {t.features || 'FEATURES'}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['GPS', 'Bluetooth', 'Backup Camera', 'Sunroof', 'Leather Seats', 'USB Charging'].map((feature) => (
                      <label key={feature} className="flex items-center gap-2 p-2 border-2 border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition-all text-sm">
                        <input
                          type="checkbox"
                          checked={formData.features?.includes(feature)}
                          onChange={(e) => {
                            const newFeatures = e.target.checked
                              ? [...(formData.features || []), feature]
                              : (formData.features || []).filter((f) => f !== feature)
                            handleInputChange('features', newFeatures)
                          }}
                          className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Rental Pricing</h3>
                  <p className="text-sm text-gray-600">Set your daily rental rate</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                    {t.dailyRate || 'DAILY RATE'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-blue-900">€</span>
                    <input
                      type="number"
                      value={formData.dailyRate}
                      onChange={(e) => handleInputChange('dailyRate', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                      className="w-full pl-14 pr-6 py-4 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-3xl font-bold text-center"
                      required
                    />
                  </div>
                  <p className="text-center text-gray-600 mt-2 text-sm">per day</p>
                </div>

                {/* Pricing Preview */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 text-sm">Rental Estimates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">3 days</span>
                      <span className="font-bold text-gray-900">€{(formData.dailyRate * 3).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">1 week</span>
                      <span className="font-bold text-gray-900">€{(formData.dailyRate * 7).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">1 month</span>
                      <span className="font-bold text-gray-900">€{(formData.dailyRate * 30).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-3 border-t-2 border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="flex items-center gap-2 text-orange-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  {t.saveChanges || 'Unsaved changes'}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border-2 border-gray-400 rounded-lg text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.imageUrl}
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t.saveChanges || 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

