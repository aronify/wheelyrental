'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { Car, CarFormData, TransmissionType, FuelType, CarStatus, Extra, ExtraUnit, CarExtra } from '@/types/car'
import { X, Save, Image as ImageIcon, Info, Settings, DollarSign, CheckCircle, MapPin } from 'lucide-react'
import CustomDropdown from '@/app/components/ui/dropdowns/custom-dropdown'
import MultiSelectDropdown from '@/app/components/ui/dropdowns/multi-select-dropdown'
import CityDropdown from '@/app/components/ui/dropdowns/city-dropdown'
import { getLocationsAction, createLocationAction, type Location } from '@/lib/server/data/cars-data-actions'
import { getExtrasAction, createExtraAction } from '@/lib/server/data/extras-data-actions'

interface EditCarFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CarFormData) => void
  car: Car
}

export default function EditCarForm({ isOpen, onClose, onSubmit, car }: EditCarFormProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'image' | 'details' | 'specs' | 'pricing' | 'locations' | 'extras'>('image')
  const [imagePreviews, setImagePreviews] = useState<string[]>(car.imageUrl ? [car.imageUrl] : [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const [colorDropdownPosition, setColorDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

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

  // Locations from database
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  // Custom location form state
  const [showCustomLocationForm, setShowCustomLocationForm] = useState<'pickup' | 'dropoff' | null>(null)
  const [customLocationData, setCustomLocationData] = useState({
    name: '',
    address: '',
    city: '',
  })
  const [isSavingCustomLocation, setIsSavingCustomLocation] = useState(false)

  // Extras state
  const [availableExtras, setAvailableExtras] = useState<Extra[]>([])
  const [isLoadingExtras, setIsLoadingExtras] = useState(false)
  const [showNewExtraForm, setShowNewExtraForm] = useState(false)
  const [newExtraData, setNewExtraData] = useState({
    name: '',
    description: '',
    defaultPrice: 0,
    unit: 'per_day' as ExtraUnit,
  })
  const [isSavingNewExtra, setIsSavingNewExtra] = useState(false)
  const [selectedExtras, setSelectedExtras] = useState<Map<string, { price: number; isIncluded: boolean }>>(new Map())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Fetch locations from database (filtered by company_id server-side)
  const fetchLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const result = await getLocationsAction()
      if (result.locations) {
        setLocations(result.locations)
      } else if (result.error) {
        console.error('Error fetching locations:', result.error)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLocations()
      fetchExtras()
    }
  }, [isOpen])

  // Fetch extras from database
  const fetchExtras = async () => {
    setIsLoadingExtras(true)
    try {
      const result = await getExtrasAction()
      if (result.extras) {
        setAvailableExtras(result.extras)
      } else if (result.error) {
        console.error('Error fetching extras:', result.error)
      }
    } catch (error) {
      console.error('Error fetching extras:', error)
    } finally {
      setIsLoadingExtras(false)
    }
  }

  // Initialize selected extras from car data
  useEffect(() => {
    if (car.extras && car.extras.length > 0) {
      const extrasMap = new Map<string, { price: number; isIncluded: boolean }>()
      car.extras.forEach(carExtra => {
        extrasMap.set(carExtra.extraId, {
          price: carExtra.price,
          isIncluded: carExtra.isIncluded || false
        })
      })
      setSelectedExtras(extrasMap)
    }
  }, [car.extras])

  // Prepare location options for dropdowns
  // Filter: Only locations where is_pickup = true (server already filtered by company_id)
  const pickupLocations = locations.filter(loc => loc.isPickupLocation)
  const pickupLocationOptions = [
    ...pickupLocations.map(loc => ({
      value: loc.id,
      label: loc.city ? `${loc.name} (${loc.city})` : loc.name,
    })),
    { value: 'CUSTOM_PICKUP', label: '➕ Custom Location' },
  ]

  // Filter: Only locations where is_dropoff = true (server already filtered by company_id)
  const dropoffLocations = locations.filter(loc => loc.isDropoffLocation)
  const dropoffLocationOptions = [
    ...dropoffLocations.map(loc => ({
      value: loc.id,
      label: loc.city ? `${loc.name} (${loc.city})` : loc.name,
    })),
    { value: 'CUSTOM_DROPOFF', label: '➕ Custom Location' },
  ]

  // Handle custom location selection
  const handleLocationChange = async (values: string[], type: 'pickup' | 'dropoff') => {
    const customValue = type === 'pickup' ? 'CUSTOM_PICKUP' : 'CUSTOM_DROPOFF'
    
    if (values.includes(customValue)) {
      // Remove the custom value and show the form
      const filteredValues = values.filter(v => v !== customValue)
      if (type === 'pickup') {
        handleInputChange('pickupLocations', filteredValues)
      } else {
        handleInputChange('dropoffLocations', filteredValues)
      }
      setShowCustomLocationForm(type)
      setCustomLocationData({ name: '', address: '', city: '' })
    } else {
      // Normal location selection
      if (type === 'pickup') {
        handleInputChange('pickupLocations', values)
      } else {
        handleInputChange('dropoffLocations', values)
      }
    }
  }

  // Save custom location
  const handleSaveCustomLocation = async () => {
    if (!customLocationData.name.trim()) {
      return
    }
    if (!customLocationData.city) {
      return
    }

    setIsSavingCustomLocation(true)
    try {
      const result = await createLocationAction({
        name: customLocationData.name,
        addressLine1: customLocationData.address || undefined,
        city: customLocationData.city || undefined,
        isPickupLocation: showCustomLocationForm === 'pickup',
        isDropoffLocation: showCustomLocationForm === 'dropoff',
      })

      if (result.location) {
        // Add new location to the list
        setLocations([...locations, result.location])
        
        // Add to selected locations
        if (showCustomLocationForm === 'pickup') {
          handleInputChange('pickupLocations', [...(formData.pickupLocations || []), result.location.id])
        } else {
          handleInputChange('dropoffLocations', [...(formData.dropoffLocations || []), result.location.id])
        }

        // Reset and close form
        setShowCustomLocationForm(null)
        setCustomLocationData({ name: '', address: '', city: '' })
      }
    } catch (error) {
      console.error('Error saving custom location:', error)
    } finally {
      setIsSavingCustomLocation(false)
    }
  }

  // Cancel custom location form
  const handleCancelCustomLocation = () => {
    setShowCustomLocationForm(null)
    setCustomLocationData({ name: '', address: '', city: '' })
  }

  // Extras handlers
  const handleToggleExtra = (extraId: string, defaultPrice: number) => {
    const newMap = new Map(selectedExtras)
    if (newMap.has(extraId)) {
      newMap.delete(extraId)
      setHasChanges(true)
    } else {
      newMap.set(extraId, { price: defaultPrice, isIncluded: false })
      setHasChanges(true)
    }
    setSelectedExtras(newMap)
  }

  const handleUpdateExtraPrice = (extraId: string, price: number) => {
    const newMap = new Map(selectedExtras)
    const existing = newMap.get(extraId)
    if (existing) {
      newMap.set(extraId, { ...existing, price })
      setSelectedExtras(newMap)
      setHasChanges(true)
    }
  }

  const handleToggleExtraIncluded = (extraId: string) => {
    const newMap = new Map(selectedExtras)
    const existing = newMap.get(extraId)
    if (existing) {
      newMap.set(extraId, { ...existing, isIncluded: !existing.isIncluded })
      setSelectedExtras(newMap)
      setHasChanges(true)
    }
  }

  const handleSaveNewExtra = async () => {
    if (!newExtraData.name || newExtraData.defaultPrice <= 0) {
      alert(t.required || 'Please fill in all required fields')
      return
    }

    setIsSavingNewExtra(true)
    try {
      const result = await createExtraAction({
        name: newExtraData.name,
        description: newExtraData.description || '',
        defaultPrice: newExtraData.defaultPrice,
        unit: newExtraData.unit,
        isActive: true,
      })

      if (result.extra) {
        setAvailableExtras(prev => [...prev, result.extra!])
        setShowNewExtraForm(false)
        setNewExtraData({ name: '', description: '', defaultPrice: 0, unit: 'per_day' })
        
        // Auto-select the newly created extra
        setSelectedExtras(prev => {
          const newMap = new Map(prev)
          newMap.set(result.extra!.id, { price: result.extra!.defaultPrice, isIncluded: false })
          return newMap
        })
        setHasChanges(true)
      } else if (result.error) {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error creating extra:', error)
      alert('Failed to create extra')
    } finally {
      setIsSavingNewExtra(false)
    }
  }

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
    depositRequired: car.depositRequired,
    status: car.status || 'active',
    imageUrl: car.imageUrl || '',
    features: car.features || [],
    pickupLocations: car.pickupLocations || [],
    dropoffLocations: car.dropoffLocations || [],
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
      // Convert selected extras to CarExtra format
      const carExtras = Array.from(selectedExtras.entries()).map(([extraId, data]) => ({
        extraId,
        price: data.price,
        isIncluded: data.isIncluded,
      }))

      // Preserve original car status - status cannot be modified through the edit form
      const submitData = { 
        ...formData, 
        imageUrl: imagePreviews[0],
        status: car.status, // Always use original status, never allow modification
        carExtras // Add extras to submission
      }
      console.log('[EditCarForm] Submitting form data:', {
        pickupLocations: submitData.pickupLocations,
        dropoffLocations: submitData.dropoffLocations,
        hasPickupLocations: !!submitData.pickupLocations,
        hasDropoffLocations: !!submitData.dropoffLocations,
        pickupLocationsLength: submitData.pickupLocations?.length,
        dropoffLocationsLength: submitData.dropoffLocations?.length,
        pickupLocationsType: typeof submitData.pickupLocations,
        dropoffLocationsType: typeof submitData.dropoffLocations,
        pickupIsArray: Array.isArray(submitData.pickupLocations),
        dropoffIsArray: Array.isArray(submitData.dropoffLocations),
        pickupFirstId: submitData.pickupLocations?.[0],
        dropoffFirstId: submitData.dropoffLocations?.[0],
        pickupFirstIdType: typeof submitData.pickupLocations?.[0],
        extrasCount: carExtras.length,
        dropoffFirstIdType: typeof submitData.dropoffLocations?.[0],
      })
      await onSubmit(submitData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = <K extends keyof CarFormData>(
    field: K,
    value: CarFormData[K]
  ) => {
    setFormData({ ...formData, [field]: value })
    setHasChanges(true)
  }

  // Reset custom location form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCustomLocationForm(null)
      setCustomLocationData({ name: '', address: '', city: '' })
    }
  }, [isOpen])

  if (!isOpen) return null

  const tabs = [
    { id: 'image' as const, label: t.image || 'Photo', icon: ImageIcon },
    { id: 'details' as const, label: t.details || 'Details', icon: Info },
    { id: 'specs' as const, label: t.specifications || 'Specs', icon: Settings },
    { id: 'pricing' as const, label: t.pricing || 'Pricing', icon: DollarSign },
    { id: 'locations' as const, label: t.locations || 'Locations', icon: MapPin },
    { id: 'extras' as const, label: t.extras || 'Extras', icon: DollarSign },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-start sm:items-center justify-center p-2 sm:p-4">
        <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl max-h-[100vh] sm:max-h-[90vh] overflow-hidden border-2 border-blue-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {t.editCar || 'Edit Vehicle'}
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm truncate">
                  {car.make} {car.model} • {car.licensePlate}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Tabs - Scrollable on mobile */}
            <div className="mt-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
              <div className="flex gap-2 min-w-max sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap touch-manipulation min-h-[44px] ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-900 shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                      <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span>{tab.label}</span>
                  </button>
                )
              })}
              </div>
            </div>
          </div>

          {/* Form - Scrollable content */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 overflow-y-auto flex-1">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                    {t.depositRequired || 'DEPOSIT REQUIRED'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-700">€</span>
                    <input
                      type="number"
                      value={formData.depositRequired || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                        handleInputChange('depositRequired', value)
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-12 pr-6 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t.depositOptional || 'Optional: Amount required as deposit for this car'}
                  </p>
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

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t.locations || 'Locations'}</h3>
                  <p className="text-sm text-gray-600">Select pickup and dropoff locations for this vehicle</p>
                    </div>

                    {/* Grid Layout: Wider on large screens for better horizontal extension */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                      {/* Pickup Location Field */}
                      <div className="flex flex-col">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                          {t.pickupLocations || 'PICKUP LOCATIONS'}
                        </label>
                        {isLoadingLocations ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center gap-2 min-h-[44px]">
                        <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-500">{t.loading || 'Loading...'}</span>
                      </div>
                    ) : pickupLocations.length === 0 ? (
                      <div className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {t.noPickupLocations || 'No pickup locations'}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            Add a location to enable pickup
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomLocationForm('pickup')
                            setCustomLocationData({ name: '', address: '', city: '' })
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {t.addLocation || 'Add Location'}
                        </button>
                          </div>
                        ) : (
                      <div className="space-y-2">
                              <MultiSelectDropdown
                                values={formData.pickupLocations || []}
                                onChange={(values) => handleLocationChange(values, 'pickup')}
                                options={pickupLocationOptions}
                                placeholder={t.pickupLocation || 'Select pickup locations'}
                          disabled={isLoadingLocations || pickupLocationOptions.length === 0}
                                icon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                }
                              />
                            </div>
                    )}
                            {showCustomLocationForm === 'pickup' && (
                      <div className="mt-6 w-full max-w-4xl mx-auto p-8 lg:p-10 bg-white border-2 border-blue-200 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                              <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                              <h4 className="text-xl font-bold text-gray-900">
                                {t.addCustomLocation || 'Add New Pickup Location'}
                                      </h4>
                              <p className="text-sm text-gray-600 mt-1">Create a custom location where customers can pick up this vehicle</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleCancelCustomLocation}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            aria-label="Close"
                                  >
                            <X className="w-6 h-6" />
                                  </button>
                                </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-bold text-gray-900 mb-3">
                                      {t.locationName || 'Location Name'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={customLocationData.name}
                                      onChange={(e) => setCustomLocationData({ ...customLocationData, name: e.target.value })}
                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white min-h-[48px] sm:min-h-[44px] touch-manipulation border-gray-300"
                                placeholder={t.enterLocationName || 'e.g., Airport Terminal, Downtown Office, Hotel Lobby'}
                                    />
                              <p className="mt-2 text-xs text-gray-500">Give your location a clear, recognizable name</p>
                                  </div>
                                  <div>
                              <label className="block text-sm font-bold text-gray-900 mb-3">
                                {t.city || 'City'} <span className="text-red-500">*</span>
                                    </label>
                              <CityDropdown
                                value={customLocationData.city}
                                onChange={(city) => setCustomLocationData({ ...customLocationData, city })}
                                placeholder={t.enterCity || 'Select a city'}
                                className="w-full"
                              />
                              <p className="mt-2 text-xs text-gray-500">Choose the city where this location is located</p>
                                  </div>
                                  <div>
                              <label className="block text-sm font-bold text-gray-900 mb-3">
                                {t.address || 'Street Address'}
                                    </label>
                                    <input
                                      type="text"
                                value={customLocationData.address}
                                onChange={(e) => setCustomLocationData({ ...customLocationData, address: e.target.value })}
                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white min-h-[48px] sm:min-h-[44px] touch-manipulation"
                                placeholder={t.enterAddress || 'e.g., Rruga Durresit 123'}
                              />
                              <p className="mt-2 text-xs text-gray-500">Optional: Add the specific street address</p>
                                  </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t-2 border-gray-100">
                                    <button
                                      type="button"
                                      onClick={handleSaveCustomLocation}
                              disabled={isSavingCustomLocation || !customLocationData.name.trim() || !customLocationData.city}
                              className="flex-1 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation min-h-[48px] sm:min-h-[44px]"
                            >
                              {isSavingCustomLocation ? (
                                <>
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t.saving || 'Saving...'}
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {t.save || 'Save Location'}
                                </>
                              )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelCustomLocation}
                              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-base touch-manipulation min-h-[48px] sm:min-h-[44px]"
                                    >
                                      {t.cancel || 'Cancel'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {t.selectMultipleLocations || 'You can select multiple locations'}
                        </p>
                      </div>

                      {/* Dropoff Location Field */}
                      <div className="flex flex-col">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                          {t.dropoffLocations || 'DROPOFF LOCATIONS'}
                        </label>
                        {isLoadingLocations ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center gap-2 min-h-[44px]">
                        <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-500">{t.loading || 'Loading...'}</span>
                      </div>
                    ) : dropoffLocations.length === 0 ? (
                      <div className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {t.noDropoffLocations || 'No dropoff locations'}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            Add a location to enable dropoff
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomLocationForm('dropoff')
                            setCustomLocationData({ name: '', address: '', city: '' })
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {t.addLocation || 'Add Location'}
                        </button>
                          </div>
                        ) : (
                      <div className="space-y-2">
                              <MultiSelectDropdown
                                values={formData.dropoffLocations || []}
                                onChange={(values) => handleLocationChange(values, 'dropoff')}
                                options={dropoffLocationOptions}
                                placeholder={t.dropoffLocation || 'Select dropoff locations'}
                          disabled={isLoadingLocations || dropoffLocationOptions.length === 0}
                                icon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                }
                              />
                            </div>
                    )}
                            {showCustomLocationForm === 'dropoff' && (
                      <div className="mt-6 w-full max-w-4xl mx-auto p-8 lg:p-10 bg-white border-2 border-green-200 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-600 rounded-xl shadow-md">
                              <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                              <h4 className="text-xl font-bold text-gray-900">
                                {t.addCustomLocation || 'Add New Dropoff Location'}
                                      </h4>
                              <p className="text-sm text-gray-600 mt-1">Create a custom location where customers can return this vehicle</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleCancelCustomLocation}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            aria-label="Close"
                                  >
                            <X className="w-6 h-6" />
                                  </button>
                                </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-bold text-gray-900 mb-3">
                                      {t.locationName || 'Location Name'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={customLocationData.name}
                                      onChange={(e) => setCustomLocationData({ ...customLocationData, name: e.target.value })}
                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 text-base bg-white min-h-[48px] sm:min-h-[44px] touch-manipulation border-gray-300"
                                placeholder={t.enterLocationName || 'e.g., Airport Terminal, Downtown Office, Hotel Lobby'}
                                    />
                              <p className="mt-2 text-xs text-gray-500">Give your location a clear, recognizable name</p>
                                  </div>
                                  <div>
                              <label className="block text-sm font-bold text-gray-900 mb-3">
                                {t.city || 'City'} <span className="text-red-500">*</span>
                                    </label>
                              <CityDropdown
                                value={customLocationData.city}
                                onChange={(city) => setCustomLocationData({ ...customLocationData, city })}
                                placeholder={t.enterCity || 'Select a city'}
                                className="w-full"
                              />
                              <p className="mt-2 text-xs text-gray-500">Choose the city where this location is located</p>
                                  </div>
                                  <div>
                              <label className="block text-sm font-bold text-gray-900 mb-3">
                                {t.address || 'Street Address'}
                                    </label>
                                    <input
                                      type="text"
                                value={customLocationData.address}
                                onChange={(e) => setCustomLocationData({ ...customLocationData, address: e.target.value })}
                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 text-base bg-white min-h-[48px] sm:min-h-[44px] touch-manipulation"
                                placeholder={t.enterAddress || 'e.g., Rruga Durresit 123'}
                              />
                              <p className="mt-2 text-xs text-gray-500">Optional: Add the specific street address</p>
                                  </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t-2 border-gray-100">
                                    <button
                                      type="button"
                                      onClick={handleSaveCustomLocation}
                              disabled={isSavingCustomLocation || !customLocationData.name.trim() || !customLocationData.city}
                              className="flex-1 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation min-h-[48px] sm:min-h-[44px]"
                            >
                              {isSavingCustomLocation ? (
                                <>
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t.saving || 'Saving...'}
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {t.save || 'Save Location'}
                                </>
                              )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelCustomLocation}
                              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-base touch-manipulation min-h-[48px] sm:min-h-[44px]"
                                    >
                                      {t.cancel || 'Cancel'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {t.selectMultipleLocations || 'You can select multiple locations'}
                        </p>
                  </div>
                </div>
              </div>
            )}

            {/* Extras Tab */}
            {activeTab === 'extras' && (
              <div className="space-y-4 sm:space-y-5">
                {/* Section Header */}
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{t.carExtras || 'Shërbimet Shtesë të Makinës'}</h3>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600">
                  {t.selectExtras || 'Zgjidhni shërbimet shtesë opsionale që klientët mund të shtojnë në rezervimin e tyre për tarifë shtesë'}
                </p>

                {isLoadingExtras ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <>
                    {/* New Extra Form */}
                    {showNewExtraForm ? (
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              {t.createNewExtra || 'Krijo Shërbim të Ri'}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{t.addExtraDescription || 'Shto një shërbim të ri që mund të ofrohet me këtë dhe mjete të tjera'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewExtraForm(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation flex-shrink-0 ml-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                  <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                              {t.extraName || 'Emri i Shërbimit'} <span className="text-red-500">*</span>
                    </label>
                            <input
                              type="text"
                              value={newExtraData.name}
                              onChange={(e) => setNewExtraData({ ...newExtraData, name: e.target.value })}
                              className="w-full px-3 sm:px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 text-base min-h-[48px] sm:min-h-[44px] touch-manipulation"
                              placeholder="p.sh., GPS, Karrige për Fëmijë, Siguri me Mbulim të Plotë"
                    />
                  </div>

                  <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                              {t.extraDescription || 'Përshkrimi'}
                    </label>
                            <textarea
                              value={newExtraData.description}
                              onChange={(e) => setNewExtraData({ ...newExtraData, description: e.target.value })}
                              className="w-full px-3 sm:px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 text-base touch-manipulation"
                              placeholder={t.extraDescription}
                              rows={2}
                    />
                  </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                              <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                                {t.defaultPrice || 'Çmimi Bazë'} (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                                min="0"
                                step="0.01"
                                value={newExtraData.defaultPrice}
                                onChange={(e) => setNewExtraData({ ...newExtraData, defaultPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 sm:px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 text-base min-h-[48px] sm:min-h-[44px] touch-manipulation"
                                placeholder="10.00"
                              />
                </div>

                <div>
                              <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                                {t.billingUnit || 'Njësia e Faturimit'}
                  </label>
                              <CustomDropdown
                                value={newExtraData.unit}
                                onChange={(value) => setNewExtraData({ ...newExtraData, unit: value as ExtraUnit })}
                                options={[
                                  { value: 'per_day', label: t.perDay || 'Për Ditë' },
                                  { value: 'per_booking', label: t.perBooking || 'Për Rezervim' },
                                  { value: 'one_time', label: t.oneTime || 'Një Herë' },
                                ]}
                                placeholder={t.billingUnit}
                                className="w-full"
                              />
                  </div>
                </div>

                          {validationErrors.newExtra && (
                            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                              <p className="text-xs sm:text-sm text-red-600 font-medium">{validationErrors.newExtra}</p>
              </div>
            )}

                          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={handleSaveNewExtra}
                              disabled={isSavingNewExtra}
                              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] touch-manipulation text-base sm:text-sm"
                            >
                              {isSavingNewExtra ? (
                                <>
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t.saving || 'Duke ruajtur...'}
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {t.saveExtra || 'Ruaj Shërbimin'}
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowNewExtraForm(false)}
                              className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all min-h-[48px] sm:min-h-[44px] touch-manipulation text-base sm:text-sm"
                            >
                              {t.cancel || 'Anulo'}
                            </button>
                </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewExtraForm(true)}
                        className="w-full px-6 py-3.5 sm:py-4 border-2 border-dashed border-blue-900 text-blue-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] touch-manipulation text-base sm:text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t.createNewExtra || 'Krijo Shërbim të Ri'}
                      </button>
                    )}

                    {/* Available Extras List */}
                    {availableExtras.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900">{t.availableExtras || 'Shërbimet e Disponueshme'}</h4>
                        {availableExtras.map((extra) => {
                          const isSelected = selectedExtras.has(extra.id)
                          const extraData = selectedExtras.get(extra.id)
                          
                          return (
                            <div
                              key={extra.id}
                              className={`border-2 rounded-xl p-3 sm:p-4 transition-all ${
                                isSelected ? 'border-blue-900 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                    <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleExtra(extra.id, extra.defaultPrice)}
                                  className="mt-1 w-5 h-5 text-blue-900 rounded focus:ring-blue-900 touch-manipulation min-w-[20px] min-h-[20px] flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm sm:text-base font-semibold text-gray-900 break-words">{extra.name}</h5>
                                      {extra.description && (
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{extra.description}</p>
                                      )}
                                      <p className="text-xs text-gray-500 mt-1">
                                        {t.defaultPrice || 'Çmimi Bazë'}: €{extra.defaultPrice.toFixed(2)} {extra.unit === 'per_day' ? (t.perDay || 'Për Ditë') : extra.unit === 'per_booking' ? (t.perBooking || 'Për Rezervim') : (t.oneTime || 'Një Herë')}
                                      </p>
                  </div>
                </div>

                                  {isSelected && extraData && (
                                    <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            {t.priceForThisCar || 'Çmimi për këtë makinë'} (€)
                  </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                                            value={extraData.price}
                                            onChange={(e) => handleUpdateExtraPrice(extra.id, parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm min-h-[44px] sm:min-h-[40px] touch-manipulation"
                    />
                  </div>
                                        <div className="flex items-end">
                                          <label className="flex items-center gap-2 cursor-pointer touch-manipulation min-h-[44px]">
                                            <input
                                              type="checkbox"
                                              checked={extraData.isIncluded}
                                              onChange={() => handleToggleExtraIncluded(extra.id)}
                                              className="w-4 h-4 text-green-600 rounded focus:ring-green-600 min-w-[16px] min-h-[16px] flex-shrink-0"
                                            />
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                                              {t.includedInBaseRate || 'E përfshirë në çmimin bazë'}
                                            </span>
                                          </label>
                </div>
                    </div>
                    </div>
                                  )}
                    </div>
                  </div>
                </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl">
                        <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-600 font-medium">{t.noExtrasYet || 'Nuk ka shërbime shtesë akoma'}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 px-4">{t.createFirstExtra || 'Krijo shërbimin tënd të parë duke përdorur butonin më sipër'}</p>
                      </div>
                    )}

                    {selectedExtras.size > 0 && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-semibold text-blue-900">
                          {selectedExtras.size} {t.extrasSelected || 'shërbim(e) shtesë të zgjedhura për këtë makinë'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>

          {/* Footer - Sticky on mobile */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 sm:px-6 py-3 border-t-2 border-gray-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0 sticky bottom-0">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              {hasChanges && (
                <span className="flex items-center gap-2 text-orange-600 text-xs sm:text-sm font-semibold">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  {t.saveChanges || 'Unsaved changes'}
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 sm:py-2 border-2 border-gray-400 rounded-lg text-gray-700 text-base sm:text-sm font-semibold hover:bg-gray-300 transition-all touch-manipulation min-h-[48px] sm:min-h-[44px]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.imageUrl}
                className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-base sm:text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md touch-manipulation min-h-[48px] sm:min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 sm:w-4 sm:h-4" />
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

