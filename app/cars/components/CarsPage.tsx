'use client'

import { useState, useMemo } from 'react'
import { Car, CarFormData, CarStatus } from '@/types/car'
import { filterCarsByStatus, searchCars } from '@/types/car'
import { useLanguage } from '@/contexts/LanguageContext'
import CarsGrid from './CarsGrid'
import CarFormModal from './CarFormModal'
import BackButton from '@/app/components/BackButton'
import Breadcrumbs from '@/app/components/Breadcrumbs'

interface CarsPageProps {
  initialCars: Car[]
}

export default function CarsPage({ initialCars }: CarsPageProps) {
  const { t } = useLanguage()
  const [cars, setCars] = useState<Car[]>(initialCars)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CarStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [carToDelete, setCarToDelete] = useState<Car | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Filter cars
  const filteredCars = useMemo(() => {
    let result = cars
    result = searchCars(result, searchTerm)
    result = filterCarsByStatus(result, statusFilter)
    return result
  }, [cars, searchTerm, statusFilter])

  // Calculate stats
  const totalCars = cars.length
  const availableCars = cars.filter((c) => c.status === 'available').length

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

  const handleDeleteCar = (car: Car) => {
    setCarToDelete(car)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (carToDelete) {
      const { deleteCarAction } = await import('../actions')
      const result = await deleteCarAction(carToDelete.id)
      
      if (result.success) {
        setCars((prev) => prev.filter((c) => c.id !== carToDelete.id))
        showSuccess(t.carDeleted)
      } else {
        showError(result.error || 'Failed to delete car')
      }
      
      setShowDeleteConfirm(false)
      setCarToDelete(null)
    }
  }

  const handleSubmitCar = async (formData: CarFormData) => {
    console.log('Submitting car with data:', formData)
    
    if (modalMode === 'add') {
      // Add new car via server action
      const { addCarAction } = await import('../actions')
      const result = await addCarAction(formData)
      
      console.log('Add car result:', result)
      
      if (result.success && result.data) {
        setCars((prev) => [result.data, ...prev])
        showSuccess(t.carAdded)
        setIsModalOpen(false)
      } else {
        const errorMsg = result.error || 'Failed to add car'
        console.error('Add car error:', errorMsg)
        showError(errorMsg)
      }
    } else {
      // Update existing car via server action
      if (!selectedCar) return
      
      const { updateCarAction } = await import('../actions')
      const result = await updateCarAction(selectedCar.id, formData)
      
      console.log('Update car result:', result)
      
      if (result.success && result.data) {
        setCars((prev) =>
          prev.map((car) =>
            car.id === selectedCar.id ? result.data : car
          )
        )
        showSuccess(t.carUpdated)
        setIsModalOpen(false)
      } else {
        const errorMsg = result.error || 'Failed to update car'
        console.error('Update car error:', errorMsg)
        showError(errorMsg)
      }
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

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label={t.back} />
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.cars}</h1>
          <p className="text-gray-600">{t.carsSubtitle}</p>
        </div>
        <button
          onClick={handleAddCar}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.addCar}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.totalCars}</p>
              <p className="text-3xl font-bold text-gray-900">{totalCars}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.availableCars}</p>
              <p className="text-3xl font-bold text-gray-900">{availableCars}</p>
            </div>
            <div className="bg-green-50 text-green-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.statusRented}</p>
              <p className="text-3xl font-bold text-gray-900">
                {cars.filter((c) => c.status === 'rented').length}
              </p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.statusMaintenance}</p>
              <p className="text-3xl font-bold text-gray-900">
                {cars.filter((c) => c.status === 'maintenance').length}
              </p>
            </div>
            <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.searchCars}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t.searchCars}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.filterByStatus}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CarStatus | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="available">{t.statusAvailable}</option>
              <option value="rented">{t.statusRented}</option>
              <option value="maintenance">{t.statusMaintenance}</option>
              <option value="inactive">{t.statusInactive}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cars Grid */}
      <CarsGrid cars={filteredCars} onEdit={handleEditCar} onDelete={handleDeleteCar} />

      {/* Car Form Modal */}
      <CarFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCar}
        car={selectedCar}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && carToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-4">
                <div className="flex items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 ml-4 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t.confirmDelete}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {t.confirmDeleteMessage}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {carToDelete.name} ({carToDelete.plateNumber})
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t.delete}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


