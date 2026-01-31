'use client'

import { useState, useEffect } from 'react'
import { Car } from '@/types/car'
import { Review } from '@/types/review'
import { X } from 'lucide-react'
import { getCarReviewsAction, ReviewStats } from '@/lib/server/data/reviews'

interface CarInfoPanelProps {
  car: Car
  isOpen: boolean
  onClose: () => void
}

type TabId = 'overview' | 'locations' | 'reviews'

export default function CarInfoPanel({ car, isOpen, onClose }: CarInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 })
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)

  // Fetch reviews when Reviews tab is opened
  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      setIsLoadingReviews(true)
      getCarReviewsAction(car.id)
        .then((result) => {
          if (result.success && result.reviews) {
            setReviews(result.reviews)
            setReviewStats(result.stats || { averageRating: 0, reviewCount: 0 })
          }
        })
        .catch((err) => {
          console.error('[CarInfoPanel] Error fetching reviews:', err)
        })
        .finally(() => {
          setIsLoadingReviews(false)
        })
    }
  }, [activeTab, car.id, reviews.length])

  if (!isOpen) return null

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'locations' as TabId, label: 'Locations' },
    { id: 'reviews' as TabId, label: 'Reviews' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Panel */}
      <div className="fixed bottom-0 lg:inset-y-0 right-0 w-full sm:w-[480px] lg:w-[600px] max-w-full h-[85vh] lg:h-full bg-white shadow-2xl z-[70] flex flex-col rounded-t-3xl lg:rounded-none min-w-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {car.make} {car.model}
              </h2>
              <p className="text-sm text-gray-600">{car.year} • {car.licensePlate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 sm:px-6 min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 min-h-[44px] px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors touch-manipulation ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'overview' && <OverviewTab car={car} />}
          {activeTab === 'locations' && <LocationsTab car={car} />}
          {activeTab === 'reviews' && (
            <ReviewsTab 
              car={car} 
              reviews={reviews} 
              stats={reviewStats} 
              isLoading={isLoadingReviews} 
            />
          )}
        </div>
      </div>
    </>
  )
}

// Overview Tab Component
function OverviewTab({ car }: { car: Car }) {
  const specs = [
    { label: 'Make', value: car.make },
    { label: 'Model', value: car.model },
    { label: 'Year', value: car.year.toString() },
    { label: 'License Plate', value: car.licensePlate },
    { label: 'Color', value: car.color || '—' },
    { label: 'Transmission', value: car.transmission },
    { label: 'Fuel Type', value: car.fuelType },
    { label: 'Seats', value: car.seats.toString() },
    { label: 'Daily Rate', value: `€${car.dailyRate.toFixed(2)}` },
    { label: 'Status', value: car.status },
    { label: 'Deposit', value: car.depositRequired ? `€${car.depositRequired.toFixed(2)}` : 'Not required' },
  ]

  // Display pickup and dropoff locations
  const hasPickupLocations = car.pickupLocationDetails && car.pickupLocationDetails.length > 0
  const hasDropoffLocations = car.dropoffLocationDetails && car.dropoffLocationDetails.length > 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Vehicle Information</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {specs.map((spec) => (
            <div key={spec.label} className="px-4 py-3 flex items-center justify-between">
              <dt className="text-sm text-gray-600">{spec.label}</dt>
              <dd className="text-sm font-medium text-gray-900">{spec.value}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      {car.features && car.features.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
          <div className="flex flex-wrap gap-2">
            {car.features.map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Locations Preview */}
      {(hasPickupLocations || hasDropoffLocations) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Locations</h3>
          <div className="space-y-2">
            {hasPickupLocations && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-gray-600">Pickup:</span>
                <span className="font-medium text-gray-900">{car.pickupLocationDetails!.length} location(s)</span>
              </div>
            )}
            {hasDropoffLocations && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-gray-600">Dropoff:</span>
                <span className="font-medium text-gray-900">{car.dropoffLocationDetails!.length} location(s)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Locations Tab Component
function LocationsTab({ car }: { car: Car }) {
  const hasPickupLocations = car.pickupLocationDetails && car.pickupLocationDetails.length > 0
  const hasDropoffLocations = car.dropoffLocationDetails && car.dropoffLocationDetails.length > 0

  return (
    <div className="space-y-6">
      {/* Pickup Locations */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Pickup Locations</h3>
        </div>
        <div className="p-4">
          {hasPickupLocations ? (
            <div className="space-y-3">
              {car.pickupLocationDetails!.map((location) => (
                <div key={location.id} className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{location.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {location.address || 'No address provided'}
                        {location.city && ` • ${location.city}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pickup locations assigned</p>
          )}
        </div>
      </div>

      {/* Dropoff Locations */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Dropoff Locations</h3>
        </div>
        <div className="p-4">
          {hasDropoffLocations ? (
            <div className="space-y-3">
              {car.dropoffLocationDetails!.map((location) => (
                <div key={location.id} className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{location.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {location.address || 'No address provided'}
                        {location.city && ` • ${location.city}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No dropoff locations assigned</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Reviews Tab Component
function ReviewsTab({ 
  car, 
  reviews, 
  stats, 
  isLoading 
}: { 
  car: Car
  reviews: Review[]
  stats: ReviewStats
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading state */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-100 rounded w-3/4" />
            <div className="h-8 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Customer Reviews</h3>
                <p className="text-sm text-gray-600">Feedback from verified rentals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-3xl font-bold text-gray-900">
                {stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : '—'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{stats.reviewCount} {stats.reviewCount === 1 ? 'review' : 'reviews'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Rating & Date */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < review.rating ? 'text-amber-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="text-sm font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
              )}

              {/* Booking Reference */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Booking: {review.bookingReference}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-gray-500 font-medium">No reviews yet</p>
        </div>
      )}
    </div>
  )
}
