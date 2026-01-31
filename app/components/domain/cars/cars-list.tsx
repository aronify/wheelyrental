'use client'

import { useState, useMemo, useEffect } from 'react'
import { Car, CarFormData, CarStatus } from '@/types/car'
import { filterCarsByStatus, searchCars } from '@/types/car'
import { useLanguage } from '@/lib/i18n/language-context'
import CarFormModalRedesigned from './car-form-modal'
import EditCarForm from './car-edit-form'
import CarInfoPanel from './car-info-panel'
import Breadcrumbs from '@/app/components/ui/navigation/breadcrumbs'
import { addCarAction, updateCarAction } from '@/lib/server/data/cars'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Pencil, Info } from 'lucide-react'
import CustomDropdown from '@/app/components/ui/dropdowns/custom-dropdown'

interface CarsPageProps {
  initialCars: Car[]
}

type ViewMode = 'grid' | 'list'

export default function CarsPageRedesigned({ initialCars }: CarsPageProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>(initialCars)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CarStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedCarForInfo, setSelectedCarForInfo] = useState<Car | null>(null)
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false)

  useEffect(() => {
    setCars(initialCars)
  }, [initialCars])

  // Filter cars
  const filteredCars = useMemo(() => {
    let result = cars
    result = searchCars(result, searchTerm)
    result = filterCarsByStatus(result, statusFilter)
    return result
  }, [cars, searchTerm, statusFilter])

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: cars.length,
      active: cars.filter((c) => c.status === 'active').length,
      maintenance: cars.filter((c) => c.status === 'maintenance').length,
      retired: cars.filter((c) => c.status === 'retired').length,
      totalRevenue: cars.reduce((sum, car) => sum + car.dailyRate, 0),
    }
  }, [cars])

  const handleAddCar = () => {
    setSelectedCar(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleEditCar = (car: Car) => {
    setSelectedCar(car)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleViewCarInfo = (car: Car) => {
    setSelectedCarForInfo(car)
    setIsInfoPanelOpen(true)
  }

  const handleSubmitCar = async (formData: CarFormData) => {
    try {
      if (modalMode === 'add') {
        const result = await addCarAction(formData)

        if (result.success && result.data) {
          // Optimistic update - add to local state immediately
          setCars((prev) => [result.data as Car, ...prev])
          showSuccess(t.carAdded || 'Car added successfully!')
          setIsModalOpen(false)
          // Refresh to sync with server
          router.refresh()
        } else {
          showError(result.error || t.carAdded || 'Failed to add car. Please try again.')
        }
      } else {
        if (!selectedCar) return

        const result = await updateCarAction(selectedCar.id, formData)

        if (result.success && result.data) {
          const updatedCar = result.data as Car
          
          // Filter out CUSTOM_PICKUP and CUSTOM_DROPOFF from submitted data for comparison
          const submittedPickup = (formData.pickupLocations || []).filter(id => id !== 'CUSTOM_PICKUP')
          const submittedDropoff = (formData.dropoffLocations || []).filter(id => id !== 'CUSTOM_DROPOFF')
          
          // Verify locations were actually saved
          const pickupMatch = JSON.stringify((updatedCar.pickupLocations || []).sort()) === JSON.stringify(submittedPickup.sort())
          const dropoffMatch = JSON.stringify((updatedCar.dropoffLocations || []).sort()) === JSON.stringify(submittedDropoff.sort())
          
          if (!pickupMatch || !dropoffMatch) {
            console.error('[CarsList] ⚠️ Location mismatch detected - locations may not have been saved!', {
              submitted: {
                pickup: submittedPickup,
                dropoff: submittedDropoff,
              },
              returned: {
                pickup: updatedCar.pickupLocations,
                dropoff: updatedCar.dropoffLocations,
              },
              pickupMatch,
              dropoffMatch,
            })
            // Still update the UI but show a warning
            setCars((prev) =>
              prev.map((car) =>
                car.id === selectedCar.id ? updatedCar : car
              )
            )
            showError('Car updated but locations may not have been saved. Please check and try again.')
            setIsModalOpen(false)
            router.refresh()
            return
          }

          setCars((prev) =>
            prev.map((car) =>
              car.id === selectedCar.id ? updatedCar : car
            )
          )
          showSuccess(t.carUpdated || 'Car updated successfully!')
          setIsModalOpen(false)
          // Refresh to sync with server
          router.refresh()
        } else {
          console.error('[CarsList] Update failed:', result.error)
          showError(result.error || 'Failed to update car. Please try again.')
        }
      }
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try with a smaller image.')
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const showError = (message: string) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(''), 5000)
  }

  const getStatusColor = (status: CarStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'retired':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: CarStatus) => {
    switch (status) {
      case 'active':
        return t.statusActive || 'Active'
      case 'maintenance':
        return t.statusMaintenance || 'Maintenance'
      case 'retired':
        return t.statusRetired || 'Retired'
      default:
        return status
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Toast Messages */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-green-500 text-white px-4 py-3 sm:px-6 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in min-w-0">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium text-sm sm:text-base truncate min-w-0">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-red-500 text-white px-4 py-3 sm:px-6 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in min-w-0">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-medium text-sm sm:text-base truncate min-w-0">{errorMessage}</span>
        </div>
      )}

      <Breadcrumbs />

      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.cars}</h1>
                  <p className="text-blue-200 text-xs sm:text-sm">{t.carsSubtitle || 'Manage your vehicle fleet'}</p>
                </div>
              </div>

              {/* Stats Pills - Minimalist */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</span>
                  <span className="text-white/90 text-xs sm:text-sm font-medium">{t.totalCars || 'Total Cars'}</span>
                </div>
                {stats.active > 0 && (
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-green-500/30 backdrop-blur-sm rounded-full border border-green-400/30">
                    <span className="text-xl sm:text-2xl font-bold text-white">{stats.active}</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{t.statusActive || 'Active'}</span>
                  </div>
                )}
                {stats.retired > 0 && (
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-500/30 backdrop-blur-sm rounded-full border border-gray-400/30">
                    <span className="text-xl sm:text-2xl font-bold text-white">{stats.retired}</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{t.statusRetired || 'Retired'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddCar}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-white text-blue-900 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm sm:text-base"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t.addCar}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t.searchCars || 'Search by make, model, or plate...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-56">
            <CustomDropdown
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as CarStatus | 'all')}
              options={[
                { value: 'all', label: t.all },
                { value: 'active', label: t.statusActive || 'Active' },
                { value: 'maintenance', label: t.statusMaintenance || 'Maintenance' },
                { value: 'retired', label: t.statusRetired || 'Retired' },
              ]}
              placeholder={t.all}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Cars Display */}
      {filteredCars.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noCarsFound}</h3>
          <p className="text-gray-500 mb-6">{t.addYourFirstCar || 'Add your first car to get started'}</p>
          <button
            onClick={handleAddCar}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t.addCar}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCars.map((car, index) => (
            <div
              key={car.id}
              className="group bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in animate-slide-in min-w-0"
              style={{
                animationDelay: `${Math.min(index * 75, 600)}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Image */}
              <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-xl">
                {car.imageUrl ? (
                  <Image
                    src={car.imageUrl}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor(car.status)}`}>
                    {getStatusText(car.status)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {car.make} {car.model}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{car.year} • {car.licensePlate}</p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{car.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{car.seats} {t.seats}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 capitalize">{car.transmission}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{car.color}</span>
                  </div>
                </div>

                {/* Extras Badge */}
                {car.extras && car.extras.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-900 mb-3 bg-blue-50 rounded-lg px-2.5 py-1.5 w-fit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{car.extras.length} extra{car.extras.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Price & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">€{car.dailyRate}</p>
                    <p className="text-xs text-gray-500">{t.perDay || 'per day'}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleViewCarInfo(car)}
                      className="p-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all"
                      title="View car info, locations, and reviews"
                      aria-label="View car information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditCar(car)}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-900 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t.edit || 'Edit'}</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-3 sm:space-y-4">
          {filteredCars.map((car) => (
            <div
              key={car.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                {/* Image */}
                <div className="relative w-full md:w-48 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                  {car.imageUrl ? (
                    <Image
                      src={car.imageUrl}
                      alt={`${car.make} ${car.model}`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {car.make} {car.model}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">{car.year} • {car.licensePlate}</p>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusColor(car.status)}`}>
                      {getStatusText(car.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {car.fuelType}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {car.seats} seats
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {car.transmission}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      {car.color}
                    </div>
                  </div>

                  {/* Extras Badge - List View */}
                  {car.extras && car.extras.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-900 mb-3 bg-blue-50 rounded-lg px-2.5 py-1.5 w-fit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">{car.extras.length} extra{car.extras.length !== 1 ? 's' : ''} available</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-blue-900">€{car.dailyRate}</span>
                      <span className="text-xs sm:text-sm text-gray-500">/ {t.day || 'day'}</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleViewCarInfo(car)}
                        className="p-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all"
                        title="View car info, locations, and reviews"
                        aria-label="View car information"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditCar(car)}
                        className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-900 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {t.edit || 'Edit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Car Modal (multi-step wizard) */}
      {modalMode === 'add' && (
        <CarFormModalRedesigned
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitCar}
          car={selectedCar}
          mode={modalMode}
        />
      )}

      {/* Edit Car Modal (tabbed interface) */}
      {modalMode === 'edit' && selectedCar && (
        <EditCarForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitCar}
          car={selectedCar}
        />
      )}

      {/* Car Info Panel (side panel with tabs) */}
      {selectedCarForInfo && (
        <CarInfoPanel
          car={selectedCarForInfo}
          isOpen={isInfoPanelOpen}
          onClose={() => {
            setIsInfoPanelOpen(false)
            setSelectedCarForInfo(null)
          }}
        />
      )}

    </div>
  )
}

