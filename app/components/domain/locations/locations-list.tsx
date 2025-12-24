'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { getLocationsAction, createLocationAction, updateLocationAction, deleteLocationAction, type Location } from '@/lib/server/data/cars-data-actions'

interface LocationItem {
  id: string
  name: string
  city?: string
  addressLine1?: string
  isPickupLocation: boolean
  isDropoffLocation: boolean
  isHq?: boolean
}

interface LocationsPageRedesignedProps {
  initialLocations: LocationItem[]
}

export default function LocationsPageRedesigned({ initialLocations }: LocationsPageRedesignedProps) {
  const { t } = useLanguage()
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    addressLine1: '',
    city: '',
    isPickupLocation: true,
    isDropoffLocation: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch locations from server
  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const result = await getLocationsAction()
      if (result.locations) {
        setLocations(result.locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          city: loc.city,
          addressLine1: loc.addressLine1,
          isPickupLocation: loc.isPickupLocation,
          isDropoffLocation: loc.isDropoffLocation,
        })))
      } else if (result.error) {
        console.error('Error fetching locations:', result.error)
      }
    } catch (error) {
      console.error('Exception fetching locations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Location name is required' })
      return
    }

    if (!formData.isPickupLocation && !formData.isDropoffLocation) {
      setErrors({ type: 'Location must be either pickup, dropoff, or both' })
      return
    }

    try {
      if (editingLocation) {
        // Update existing location
        const result = await updateLocationAction(editingLocation.id, {
          name: formData.name.trim(),
          addressLine1: formData.addressLine1.trim() || undefined,
          city: formData.city.trim() || undefined,
          isPickupLocation: formData.isPickupLocation,
          isDropoffLocation: formData.isDropoffLocation,
        })

        if (result.error) {
          setErrors({ submit: result.error })
        } else {
          await fetchLocations()
          handleCancel()
        }
      } else {
        // Create new location
        const result = await createLocationAction({
          name: formData.name.trim(),
          addressLine1: formData.addressLine1.trim() || undefined,
          city: formData.city.trim() || undefined,
          isPickupLocation: formData.isPickupLocation,
          isDropoffLocation: formData.isDropoffLocation,
        })

        if (result.error) {
          setErrors({ submit: result.error })
        } else {
          await fetchLocations()
          handleCancel()
        }
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
      console.error('Error saving location:', error)
    }
  }

  // Handle edit
  const handleEdit = (location: LocationItem) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      addressLine1: location.addressLine1 || '',
      city: location.city || '',
      isPickupLocation: location.isPickupLocation,
      isDropoffLocation: location.isDropoffLocation,
    })
    setShowAddForm(true)
  }

  // Handle delete
  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }

    try {
      const result = await deleteLocationAction(locationId)
      if (result.error) {
        alert(`Error deleting location: ${result.error}`)
      } else {
        await fetchLocations()
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      alert('Failed to delete location')
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setShowAddForm(false)
    setEditingLocation(null)
    setFormData({
      name: '',
      addressLine1: '',
      city: '',
      isPickupLocation: true,
      isDropoffLocation: true,
    })
    setErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t.locations || 'Locations'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage pickup and dropoff locations for your company
          </p>
        </div>
        <button
          onClick={() => {
            handleCancel()
            setShowAddForm(true)
          }}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.addLocation || 'Add Location'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingLocation ? 'Edit Location' : 'Add New Location'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Downtown Office, Airport Terminal"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="City name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Location Type *
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPickupLocation}
                    onChange={(e) => setFormData({ ...formData, isPickupLocation: e.target.checked })}
                    className="w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pickup Location</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDropoffLocation}
                    onChange={(e) => setFormData({ ...formData, isDropoffLocation: e.target.checked })}
                    className="w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                  />
                  <span className="ml-2 text-sm text-gray-700">Dropoff Location</span>
                </label>
              </div>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors min-h-[44px]"
              >
                {editingLocation ? 'Update Location' : 'Add Location'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations yet</h3>
          <p className="text-gray-500 mb-4">Add your first location to get started</p>
          <button
            onClick={() => {
              handleCancel()
              setShowAddForm(true)
            }}
            className="inline-flex items-center px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Location
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{location.addressLine1 || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{location.city || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {location.isPickupLocation && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Pickup
                          </span>
                        )}
                        {location.isDropoffLocation && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Dropoff
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(location)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


