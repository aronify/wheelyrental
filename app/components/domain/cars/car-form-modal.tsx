'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { Car, CarFormData, TransmissionType, FuelType, CarStatus } from '@/types/car'
import { X, Image as ImageIcon, Info, Settings, MapPin } from 'lucide-react'
import CustomDropdown from '@/app/components/ui/dropdowns/custom-dropdown'
import MultiSelectDropdown from '@/app/components/ui/dropdowns/multi-select-dropdown'
import { getLocationsAction, createLocationAction, type Location } from '@/lib/server/data/cars-data-actions'

interface CarFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CarFormData) => void
  car?: Car | null
  mode: 'add' | 'edit'
}

export default function CarFormModalRedesigned({ isOpen, onClose, onSubmit, car, mode }: CarFormModalProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'image' | 'details' | 'specs' | 'locations'>('image')
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false)
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

  // Fetch locations from database (filtered by company_id server-side)
  const fetchLocations = async () => {
    setIsLoadingLocations(true)
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.locations
      return newErrors
    })
    
    try {
      const result = await getLocationsAction()
      
      if (result.error) {
        // Only log critical errors
        if (!result.error.includes('Permission denied')) {
          console.error('[CarForm] Error fetching locations:', result.error)
        }
        
        // Check if it's an RLS/permission error
        if (result.error.includes('Permission denied') || result.error.includes('RLS')) {
          setValidationErrors(prev => ({
            ...prev,
            locations: 'Permission error. Please run database/rls-policies/fix-jwt-rls-defensive-complete.sql'
          }))
        } else {
          setValidationErrors(prev => ({
            ...prev,
            locations: result.error || 'Failed to load locations'
          }))
        }
        setLocations([])
        return
      }
      
      if (result.locations && result.locations.length > 0) {
        setLocations(result.locations)
        
        // Auto-preselect if locations exist
        const pickupLocs = result.locations.filter(loc => Boolean(loc.isPickupLocation))
        const dropoffLocs = result.locations.filter(loc => Boolean(loc.isDropoffLocation))
        
        // Auto-select if only one pickup location (and not already selected)
        if (pickupLocs.length === 1) {
          const currentPickup = formData.pickupLocations || []
          if (!currentPickup.includes(pickupLocs[0].id)) {
            setFormData(prev => ({ 
              ...prev, 
              pickupLocations: [pickupLocs[0].id] 
            }))
          }
        }
        
        // Auto-select if only one dropoff location (and not already selected)
        if (dropoffLocs.length === 1) {
          const currentDropoff = formData.dropoffLocations || []
          if (!currentDropoff.includes(dropoffLocs[0].id)) {
            setFormData(prev => ({ 
              ...prev, 
              dropoffLocations: [dropoffLocs[0].id] 
            }))
          }
        }
      } else {
        // Empty result - no locations found
        setLocations([])
      }
    } catch (error) {
      console.error('[CarForm] 💥 Exception fetching locations:', error)
      setValidationErrors(prev => ({
        ...prev,
        locations: `Failed to load locations: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      setLocations([])
    } finally {
      setIsLoadingLocations(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLocations()
    }
  }, [isOpen])

  // Prepare location options for dropdowns
  // Filter: Only locations where is_pickup = true (server already filtered by company_id)
  const pickupLocations = locations.filter(loc => Boolean(loc.isPickupLocation))
  
  const pickupLocationOptions = [
    ...pickupLocations.map(loc => ({
      value: loc.id,
      label: loc.city ? `${loc.name} (${loc.city})` : loc.name,
    })),
    { value: 'CUSTOM_PICKUP', label: '➕ Add Custom Location' },
  ]

  // Filter: Only locations where is_dropoff = true (server already filtered by company_id)
  const dropoffLocations = locations.filter(loc => Boolean(loc.isDropoffLocation))
  
  const dropoffLocationOptions = [
    ...dropoffLocations.map(loc => ({
      value: loc.id,
      label: loc.city ? `${loc.name} (${loc.city})` : loc.name,
    })),
    { value: 'CUSTOM_DROPOFF', label: '➕ Add Custom Location' },
  ]

  // Handle custom location selection
  const handleLocationChange = async (values: string[], type: 'pickup' | 'dropoff') => {
    const customValue = type === 'pickup' ? 'CUSTOM_PICKUP' : 'CUSTOM_DROPOFF'
    
    if (values.includes(customValue)) {
      // Remove the custom value and show the form
      const filteredValues = values.filter(v => v !== customValue)
      if (type === 'pickup') {
        setFormData({ ...formData, pickupLocations: filteredValues })
      } else {
        setFormData({ ...formData, dropoffLocations: filteredValues })
      }
      setShowCustomLocationForm(type)
      setCustomLocationData({ name: '', address: '', city: '' })
    } else {
      // Normal location selection
      if (type === 'pickup') {
        setFormData({ ...formData, pickupLocations: values })
      } else {
        setFormData({ ...formData, dropoffLocations: values })
      }
    }
  }

  // Save custom location
  const handleSaveCustomLocation = async () => {
    if (!customLocationData.name.trim()) {
      setValidationErrors({ ...validationErrors, customLocation: 'Location name is required' })
      return
    }

    setIsSavingCustomLocation(true)
    try {
      // Explicitly set flags based on which form is open
      const isPickup = showCustomLocationForm === 'pickup'
      const isDropoff = showCustomLocationForm === 'dropoff'
      
      console.log('[CarForm] Creating location:', {
        name: customLocationData.name,
        isPickup,
        isDropoff,
        formType: showCustomLocationForm
      })
      
      const result = await createLocationAction({
        name: customLocationData.name,
        addressLine1: customLocationData.address || undefined,
        city: customLocationData.city || undefined,
        isPickupLocation: isPickup, // Explicitly set: true only if pickup form
        isDropoffLocation: isDropoff, // Explicitly set: true only if dropoff form
      })

      if (result.location) {
        // Refresh locations list to get latest data from server
        await fetchLocations()
        
        // Add to selected locations
        if (showCustomLocationForm === 'pickup') {
          setFormData(prev => ({
            ...prev,
            pickupLocations: [...(prev.pickupLocations || []), result.location!.id],
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            dropoffLocations: [...(prev.dropoffLocations || []), result.location!.id],
          }))
        }

        // Reset and close form
        setShowCustomLocationForm(null)
        setCustomLocationData({ name: '', address: '', city: '' })
        setValidationErrors(prev => ({ ...prev, customLocation: '' }))
      } else if (result.error) {
        console.error('[CarForm] Error creating location:', result.error)
        setValidationErrors(prev => ({ ...prev, customLocation: result.error || 'Failed to create location' }))
      }
    } catch (error) {
      console.error('Error saving custom location:', error)
      setValidationErrors({ ...validationErrors, customLocation: 'Failed to save custom location' })
    } finally {
      setIsSavingCustomLocation(false)
    }
  }

  // Cancel custom location form
  const handleCancelCustomLocation = () => {
    setShowCustomLocationForm(null)
    setCustomLocationData({ name: '', address: '', city: '' })
    setValidationErrors({ ...validationErrors, customLocation: '' })
  }

  const [formData, setFormData] = useState<CarFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    dailyRate: 0,
    depositRequired: undefined,
    imageUrl: '',
    status: 'active', // Always default to 'active' - system handles status automatically
    features: [],
    pickupLocations: [],
    dropoffLocations: [],
  })

  const [newFeature, setNewFeature] = useState('')

  // Update form data when car prop changes or modal opens
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
          depositRequired: car.depositRequired,
          imageUrl: car.imageUrl || '',
          status: car.status || 'active', // Preserve existing status when editing
          features: car.features || [],
          pickupLocations: car.pickupLocations || [],
          dropoffLocations: car.dropoffLocations || [],
        })
        setImagePreviews(car.imageUrl ? [car.imageUrl] : [])
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
          depositRequired: undefined,
          imageUrl: '',
          status: 'active', // Always default to 'active' - system handles status automatically
          features: [],
          pickupLocations: [],
          dropoffLocations: [],
        })
        setImagePreviews([])
        setImageFiles([])
      }
      setNewFeature('')
      setImageError(null)
      setActiveTab('image')
      setShowCustomLocationForm(null)
      setCustomLocationData({ name: '', address: '', city: '' })
    }
  }, [isOpen, car])


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Prevent any form submission - only allow through explicit button click
    return false
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Check image
    if (!imagePreviews.length || !imagePreviews[0]) {
      errors.image = t.required || 'Please upload a car image'
    }
    
    // Check required fields
    if (!formData.make || formData.make.trim() === '') {
      errors.make = t.make || 'Make is required'
    }
    
    if (!formData.model || formData.model.trim() === '') {
      errors.model = t.model || 'Model is required'
    }
    
    if (!formData.year || formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      errors.year = t.year || 'Valid year is required'
    }
    
    if (!formData.licensePlate || formData.licensePlate.trim() === '') {
      errors.licensePlate = t.licensePlate || 'License plate is required'
    }
    
    if (!formData.color || formData.color.trim() === '') {
      errors.color = t.color || 'Color is required'
    }
    
    if (!formData.dailyRate || formData.dailyRate <= 0) {
      errors.dailyRate = t.dailyRate || 'Daily rate must be greater than 0'
    }
    
    if (!formData.transmission) {
      errors.transmission = t.transmission || 'Transmission is required'
    }
    
    if (!formData.fuelType) {
      errors.fuelType = t.fuelType || 'Fuel type is required'
    }
    
    if (!formData.seats || formData.seats < 1 || formData.seats > 20) {
      errors.seats = t.seats || 'Valid number of seats is required (1-20)'
    }
    
    setValidationErrors(errors)
    
    // If there are errors, navigate to the appropriate tab
    if (Object.keys(errors).length > 0) {
      if (errors.image) {
        setActiveTab('image')
        setImageError(errors.image)
      } else if (errors.make || errors.model || errors.year || errors.licensePlate || errors.color || errors.dailyRate) {
        setActiveTab('details')
      } else if (errors.transmission || errors.fuelType || errors.seats) {
        setActiveTab('specs')
      }
      return false
    }
    
    return true
  }

  const handleSaveClick = async () => {
    // Clear previous errors
    setValidationErrors({})
    setImageError(null)
    
    // Validate all fields
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit({ ...formData, imageUrl: imagePreviews[0] })
      // Success - parent component will close modal
    } catch (error: unknown) {
      setImageError(error instanceof Error ? error.message : 'Failed to save car. Try using a smaller image.')
      setActiveTab('image') // Go back to image tab to show error
      setIsSubmitting(false)
    }
  }

  const handleImageFile = (file: File) => {
    setImageError(null)
    if (!file.type.startsWith('image/')) {
      setImageError(t.required || 'Please upload an image file')
      return
    }

    // Check original file size
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image is too large. Please use an image smaller than 10MB.')
      return
    }

    // Compress and resize the image
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Set max dimensions (maintain aspect ratio)
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height)

        // Convert to base64 with compression (0.7 quality for JPEGs)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
        
        // Check if compressed size is still too large
        const sizeInBytes = (compressedBase64.length * 3) / 4
        if (sizeInBytes > 800 * 1024) { // 800KB limit for base64
          setImageError('Image is still too large after compression. Please use a smaller image.')
          return
        }

        // Add to existing images instead of replacing
        setImagePreviews(prev => [...prev, compressedBase64])
        setImageFiles(prev => [...prev, file])
      }
      img.onerror = () => {
        setImageError('Failed to load image. Please try another file.')
      }
      img.src = reader.result as string
    }
    reader.onerror = () => {
      setImageError('Failed to read image file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    if (files && files.length > 0) {
      // Process each file
      Array.from(files).forEach(file => {
        handleImageFile(file)
      })
      // Reset the input value so the same files can be selected again
      e.target.value = ''
    }
  }

  const handleRemoveImageByIndex = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddMorePhotos = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      // Use setTimeout to ensure the value is cleared before clicking
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 0)
    }
  }

  const handleRemoveImage = () => {
    setImagePreviews([])
    setImageFiles([])
    setImageError(null)
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

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()],
      })
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((_, i) => i !== index),
    })
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'image' as const, label: t.image || 'Photo', icon: ImageIcon },
    { id: 'details' as const, label: t.details || 'Details', icon: Info },
    { id: 'specs' as const, label: t.specifications || 'Specs', icon: Settings },
    { id: 'locations' as const, label: t.locations || 'Locations', icon: MapPin },
  ]

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-hidden border-2 border-blue-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {mode === 'add' ? t.addCar || 'Add Vehicle' : t.editCar || 'Edit Vehicle'}
                </h2>
                <p className="text-blue-100 text-xs">
                  {mode === 'add' ? t.addNewCarToFleet || 'Add a new car to your fleet' : car ? `${car.make} ${car.model} • ${car.licensePlate}` : ''}
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
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Image Tab */}
            {activeTab === 'image' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{t.uploadCarImage || 'Upload Car Image'}</h4>
                    <p className="text-sm text-gray-600">{t.uploadCarImageDescription || 'A clear image helps attract more customers'}</p>
                  </div>

                  {imagePreviews.length > 0 && imagePreviews[0] ? (
                    <div className="space-y-4">
                      {/* Primary Image (First Image) */}
                      <div className="relative rounded-2xl overflow-hidden border-4 border-blue-900 shadow-2xl">
                        <div className="absolute top-4 left-4 px-3 py-1 bg-blue-900 text-white text-xs font-semibold rounded-full z-10">
                          Primary Photo
                        </div>
                        <img
                          src={imagePreviews[0]}
                          alt="Car preview - Primary"
                          className="w-full h-80 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageByIndex(0)}
                          className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Additional Images Grid */}
                      {imagePreviews.length > 1 && (
                        <div className="grid grid-cols-3 gap-4">
                          {imagePreviews.slice(1).map((preview, index) => (
                            <div key={index + 1} className="relative rounded-xl overflow-hidden border-2 border-gray-300 shadow-md group">
                              <img
                                src={preview}
                                alt={`Car preview ${index + 2}`}
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImageByIndex(index + 1)}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add More Photos Button */}
                      <label
                        htmlFor="car-image-input"
                        className="w-full px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {imagePreviews.length === 1 ? (t.addMorePhotos || 'Add More Photos') : (t.addAnotherPhoto || 'Add Another Photo')}
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="car-image-input"
                      className={`flex flex-col items-center justify-center w-full h-80 border-4 border-dashed rounded-2xl cursor-pointer transition-all ${
                        isDragging 
                          ? 'border-blue-900 bg-blue-50 scale-105' 
                          : 'border-gray-300 hover:border-blue-600 hover:bg-gray-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                          <p className="mb-2 text-lg font-semibold text-gray-900">
                            <span className="text-blue-900">{t.clickToUpload || 'Click to upload'}</span> {t.orDragAndDrop || 'or drag and drop'}
                          </p>
                          <p className="text-sm text-gray-500 mb-1">PNG, JPG, WEBP (MAX. 10MB each)</p>
                          <p className="text-xs text-gray-400">{t.autoCompressed || 'Upload multiple photos - first will be primary'}</p>
                      </div>
                    </label>
                  )}
                  
                  {/* Hidden file input - always rendered */}
                  <input id="car-image-input" ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                  
                  {imageError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-in">
                      <p className="text-sm text-red-600 font-medium">{imageError}</p>
                    </div>
                  )}
                </div>
              )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ overflow: 'visible' }}>
                    {/* Make */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.make || 'MAKE'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.make}
                        onChange={(e) => {
                          setFormData({ ...formData, make: e.target.value })
                          if (validationErrors.make) {
                            setValidationErrors({ ...validationErrors, make: '' })
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 min-h-[44px] text-base sm:text-sm ${
                          validationErrors.make ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Toyota, BMW, Mercedes"
                      />
                      {validationErrors.make && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.make}</p>
                      )}
                    </div>

                    {/* Model */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.model || 'MODEL'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.model}
                        onChange={(e) => {
                          setFormData({ ...formData, model: e.target.value })
                          if (validationErrors.model) {
                            setValidationErrors({ ...validationErrors, model: '' })
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 min-h-[44px] text-base sm:text-sm ${
                          validationErrors.model ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Corolla, X5, E-Class"
                      />
                      {validationErrors.model && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.model}</p>
                      )}
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.year || 'YEAR'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        value={formData.year}
                        onChange={(e) => {
                          setFormData({ ...formData, year: parseInt(e.target.value) || 0 })
                          if (validationErrors.year) {
                            setValidationErrors({ ...validationErrors, year: '' })
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 min-h-[44px] text-base sm:text-sm ${
                          validationErrors.year ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="2024"
                      />
                      {validationErrors.year && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.year}</p>
                      )}
                    </div>

                    {/* License Plate */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.licensePlate || 'LICENSE PLATE'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.licensePlate}
                        onChange={(e) => {
                          setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
                          if (validationErrors.licensePlate) {
                            setValidationErrors({ ...validationErrors, licensePlate: '' })
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 uppercase min-h-[44px] text-base sm:text-sm ${
                          validationErrors.licensePlate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="TR-1234-AB"
                      />
                      {validationErrors.licensePlate && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.licensePlate}</p>
                      )}
                    </div>

                    {/* Color */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.color || 'COLOR'} <span className="text-red-500">*</span>
                      </label>
                      <button
                        ref={colorButtonRef}
                        type="button"
                        onClick={(e) => {
                          if (colorButtonRef.current) {
                            const rect = colorButtonRef.current.getBoundingClientRect()
                            setColorDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            })
                          }
                          setIsColorDropdownOpen(!isColorDropdownOpen)
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 bg-white flex items-center justify-between hover:border-blue-400 min-h-[44px] text-base sm:text-sm ${
                          validationErrors.color ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {formData.color ? (
                            <>
                              <div
                                className="w-7 h-7 rounded-lg shadow-sm flex-shrink-0"
                                style={{
                                  backgroundColor: carColors.find(c => c.name === formData.color)?.hex || '#CCCCCC',
                                  border: formData.color === 'White' ? '2px solid #E5E7EB' : '2px solid ' + (carColors.find(c => c.name === formData.color)?.hex || '#CCCCCC')
                                }}
                              />
                              <span className="text-sm font-medium">{formData.color}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">{t.selectColor || 'Select a color'}</span>
                          )}
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isColorDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {validationErrors.color && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.color}</p>
                      )}
                    </div>

                    {/* Daily Rate */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.dailyRate || 'DAILY RATE'} (€) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.dailyRate}
                        onChange={(e) => {
                          setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })
                          if (validationErrors.dailyRate) {
                            setValidationErrors({ ...validationErrors, dailyRate: '' })
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 ${
                          validationErrors.dailyRate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="50.00"
                      />
                      {validationErrors.dailyRate && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.dailyRate}</p>
                      )}
                    </div>

                    {/* Deposit Required */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.depositRequired || 'DEPOSIT REQUIRED'} (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.depositRequired || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                          setFormData({ ...formData, depositRequired: value })
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900"
                        placeholder="0.00"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {t.depositOptional || 'Optional: Amount required as deposit for this car'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transmission */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.transmission || 'TRANSMISSION'} <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={formData.transmission}
                        onChange={(value) => {
                          setFormData({ ...formData, transmission: value as TransmissionType })
                          if (validationErrors.transmission) {
                            setValidationErrors({ ...validationErrors, transmission: '' })
                          }
                        }}
                        options={[
                          { value: 'automatic', label: t.automatic },
                          { value: 'manual', label: t.manual },
                        ]}
                        placeholder={t.transmission || 'Select transmission'}
                        required={true}
                        error={!!validationErrors.transmission}
                      />
                      {validationErrors.transmission && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.transmission}</p>
                      )}
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.fuelType || 'FUEL TYPE'} <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={formData.fuelType}
                        onChange={(value) => {
                          setFormData({ ...formData, fuelType: value as FuelType })
                          if (validationErrors.fuelType) {
                            setValidationErrors({ ...validationErrors, fuelType: '' })
                          }
                        }}
                        options={[
                          { value: 'petrol', label: t.petrol },
                          { value: 'diesel', label: t.diesel },
                          { value: 'electric', label: t.electric },
                          { value: 'hybrid', label: t.hybrid },
                        ]}
                        placeholder={t.fuelType || 'Select fuel type'}
                        required={true}
                        error={!!validationErrors.fuelType}
                      />
                      {validationErrors.fuelType && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.fuelType}</p>
                      )}
                    </div>

                    {/* Seats */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t.seats || 'SEATS'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="20"
                        value={formData.seats}
                        onChange={(e) => {
                          setFormData({ ...formData, seats: parseInt(e.target.value) || 0 })
                          if (validationErrors.seats) {
                            setValidationErrors({ ...validationErrors, seats: '' })
                          }
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900 min-h-[44px] text-base sm:text-sm ${
                          validationErrors.seats ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="5"
                      />
                      {validationErrors.seats && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.seats}</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t.features || 'FEATURES'}
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                        placeholder="e.g., Air Conditioning, GPS, Bluetooth"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
                      >
                        {t.add || 'Add'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.features || []).map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-medium"
                        >
                          {feature}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="text-blue-900 hover:text-blue-700"
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
              )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <div className="space-y-5">
                {/* Section Header */}
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900">{t.locations || 'LOCATIONS'}</h3>
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
                            <div className="mt-6 p-6 lg:p-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-2 border-blue-300 rounded-2xl shadow-lg">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-600 rounded-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-gray-900">
                                      {t.addCustomLocation || 'Add Custom Pickup Location'}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Create a new location for vehicle pickup</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCancelCustomLocation}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-all"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="space-y-5">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                    {t.locationName || 'Location Name'} <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={customLocationData.name}
                                    onChange={(e) => setCustomLocationData({ ...customLocationData, name: e.target.value })}
                                    className={`w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white ${
                                      validationErrors.customLocation ? 'border-red-500' : ''
                                    }`}
                                    placeholder={t.enterLocationName || 'Enter location name (e.g., Airport Terminal)'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                    {t.address || 'Street Address'}
                                  </label>
                                  <input
                                    type="text"
                                    value={customLocationData.address}
                                    onChange={(e) => setCustomLocationData({ ...customLocationData, address: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white"
                                    placeholder={t.enterAddress || 'Enter street address'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                    {t.city || 'City'}
                                  </label>
                                  <input
                                    type="text"
                                    value={customLocationData.city}
                                    onChange={(e) => setCustomLocationData({ ...customLocationData, city: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white"
                                    placeholder={t.enterCity || 'Enter city name'}
                                  />
                                </div>
                                {validationErrors.customLocation && (
                                  <p className="mt-1 text-sm text-red-600">{validationErrors.customLocation}</p>
                                )}
                                <div className="flex gap-4 pt-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveCustomLocation}
                                    disabled={isSavingCustomLocation || !customLocationData.name.trim()}
                                    className="flex-1 px-6 py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md hover:shadow-lg"
                                  >
                                    {isSavingCustomLocation ? (t.saving || 'Saving...') : (t.save || 'Save Location')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelCustomLocation}
                                    className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-base"
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
                            <div className="mt-6 p-6 lg:p-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-2 border-blue-300 rounded-2xl shadow-lg">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-600 rounded-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-gray-900">
                                      {t.addCustomLocation || 'Add Custom Dropoff Location'}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Create a new location for vehicle dropoff</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCancelCustomLocation}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-all"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="space-y-5">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                    {t.locationName || 'Location Name'} <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={customLocationData.name}
                                    onChange={(e) => setCustomLocationData({ ...customLocationData, name: e.target.value })}
                                    className={`w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white ${
                                      validationErrors.customLocation ? 'border-red-500' : ''
                                    }`}
                                    placeholder={t.enterLocationName || 'Enter location name (e.g., Airport Terminal)'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                    {t.address || 'Street Address'}
                                  </label>
                                  <input
                                    type="text"
                                    value={customLocationData.address}
                                    onChange={(e) => setCustomLocationData({ ...customLocationData, address: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white"
                                    placeholder={t.enterAddress || 'Enter street address'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                    {t.city || 'City'}
                                  </label>
                                  <input
                                    type="text"
                                    value={customLocationData.city}
                                    onChange={(e) => setCustomLocationData({ ...customLocationData, city: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-base bg-white"
                                    placeholder={t.enterCity || 'Enter city name'}
                                  />
                                </div>
                                {validationErrors.customLocation && (
                                  <p className="mt-1 text-sm text-red-600">{validationErrors.customLocation}</p>
                                )}
                                <div className="flex gap-4 pt-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveCustomLocation}
                                    disabled={isSavingCustomLocation || !customLocationData.name.trim()}
                                    className="flex-1 px-6 py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md hover:shadow-lg"
                                  >
                                    {isSavingCustomLocation ? (t.saving || 'Saving...') : (t.save || 'Save Location')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelCustomLocation}
                                    className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-base"
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
            </form>

            {/* Footer */}
            <div className="bg-white border-t-2 border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                {t.cancel || 'Cancel'}
              </button>
              
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSubmitting}
                className="px-6 sm:px-8 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    {mode === 'add' ? (t.addCar || 'Add Vehicle') : (t.saveChanges || 'Save Changes')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Color Dropdown Portal */}
      {isColorDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsColorDropdownOpen(false)}
          />
          {/* Dropdown */}
          <div
            className="fixed z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
            style={{
              top: `${colorDropdownPosition.top}px`,
              left: `${colorDropdownPosition.left}px`,
              width: `${colorDropdownPosition.width}px`
            }}
          >
            <div className="p-2">
              {carColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, color: color.name })
                    setIsColorDropdownOpen(false)
                    if (validationErrors.color) {
                      setValidationErrors({ ...validationErrors, color: '' })
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors ${
                    formData.color === color.name ? 'bg-blue-100 ring-2 ring-blue-900' : ''
                  }`}
                >
                  {/* Color Swatch */}
                  <div
                    className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0"
                    style={{
                      backgroundColor: color.hex,
                      border: color.hex === '#FFFFFF' ? '2px solid #E5E7EB' : '2px solid ' + color.hex
                    }}
                  />
                  {/* Color Name */}
                  <span className="text-sm font-medium text-gray-900 text-left flex-1">{color.name}</span>
                  {/* Check Icon */}
                  {formData.color === color.name && (
                    <svg className="w-4 h-4 text-blue-900 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}

