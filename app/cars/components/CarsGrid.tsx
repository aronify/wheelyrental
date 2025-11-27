'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Car } from '@/types/car'
import Image from 'next/image'

interface CarsGridProps {
  cars: Car[]
  onEdit: (car: Car) => void
  onDelete: (car: Car) => void
}

export default function CarsGrid({ cars, onEdit, onDelete }: CarsGridProps) {
  const { t } = useLanguage()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rented':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return t.statusAvailable
      case 'rented':
        return t.statusRented
      case 'maintenance':
        return t.statusMaintenance
      case 'inactive':
        return t.statusInactive
      default:
        return status
    }
  }

  const getTransmissionText = (transmission: string) => {
    return transmission === 'automatic' ? t.automatic : t.manual
  }

  const getFuelTypeText = (fuelType: string) => {
    switch (fuelType) {
      case 'petrol':
        return t.petrol
      case 'diesel':
        return t.diesel
      case 'electric':
        return t.electric
      case 'hybrid':
        return t.hybrid
      default:
        return fuelType
    }
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-24 h-24 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noCarsFound}</h3>
        <p className="text-gray-500">{t.addCar}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <div
          key={car.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Image */}
          <div className="relative h-48 bg-gray-100">
            <Image
              src={car.imageUrl}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
            />
            <div className="absolute top-3 right-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  car.status
                )}`}
              >
                {getStatusText(car.status)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{car.make} {car.model}</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t.plateNumber}:</span>
                <span className="font-medium text-gray-900">{car.licensePlate}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t.year}:</span>
                <span className="font-medium text-gray-900">{car.year}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t.color}:</span>
                <span className="font-medium text-gray-900">{car.color}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {car.seats} seats
                </span>
                <span>{getTransmissionText(car.transmission)}</span>
                <span>{getFuelTypeText(car.fuelType)}</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">{t.dailyRate}:</span>
              <span className="text-2xl font-bold text-blue-900">
                €{car.dailyRate}
                <span className="text-sm font-normal text-gray-600">/{t.perDay.split(' ')[0]}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(car)}
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {t.editCar}
              </button>
              <button
                onClick={() => onDelete(car)}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                {t.deleteCar}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


