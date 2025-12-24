'use client'

import { useState, useMemo } from 'react'
import { Review } from '@/types/review'
import { useLanguage } from '@/lib/i18n/language-context'
import Breadcrumbs from '@/app/components/ui/navigation/breadcrumbs'
import { Star, Calendar, User, Car, MessageSquare } from 'lucide-react'
import Image from 'next/image'

interface ReviewsListProps {
  initialReviews: Review[]
}

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'

export default function ReviewsList({ initialReviews }: ReviewsListProps) {
  const { t } = useLanguage()
  const [reviews] = useState<Review[]>(initialReviews)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let filtered = reviews

    // Filter by rating
    if (ratingFilter !== 'all') {
      filtered = filtered.filter((review) => review.rating === parseInt(ratingFilter))
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((review) => {
        const carName = review.car ? `${review.car.make} ${review.car.model}` : ''
        const customerName = review.customer
          ? `${review.customer.firstName || ''} ${review.customer.lastName || ''}`.trim() || review.customer.name || ''
          : ''
        return (
          carName.toLowerCase().includes(term) ||
          customerName.toLowerCase().includes(term) ||
          review.bookingReference?.toLowerCase().includes(term) ||
          review.title?.toLowerCase().includes(term) ||
          review.comment?.toLowerCase().includes(term)
        )
      })
    }

    return filtered
  }, [reviews, searchTerm, ratingFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reviews.length
    const average = total > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0
    const byRating = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    }

    return { total, average, byRating }
  }, [reviews])

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {t.reviews || 'Reviews'}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              {t.reviewsSubtitle || 'View customer feedback for your cars'}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
            <div className="text-blue-100 text-xs sm:text-sm mt-1">
              {t.totalReviews || 'Total Reviews'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold">{stats.average}</div>
            <div className="text-blue-100 text-xs sm:text-sm mt-1">
              {t.averageRating || 'Avg Rating'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold">{stats.byRating[5]}</div>
            <div className="text-blue-100 text-xs sm:text-sm mt-1">
              {t.fiveStarReviews || '5 Stars'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold">{stats.byRating[1]}</div>
            <div className="text-blue-100 text-xs sm:text-sm mt-1">
              {t.oneStarReviews || '1 Star'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t.searchReviews || 'Search reviews...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Rating Filter */}
          <div className="sm:w-48">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">{t.allRatings || 'All Ratings'}</option>
              <option value="5">5 {t.stars || 'Stars'}</option>
              <option value="4">4 {t.stars || 'Stars'}</option>
              <option value="3">3 {t.stars || 'Stars'}</option>
              <option value="2">2 {t.stars || 'Stars'}</option>
              <option value="1">1 {t.star || 'Star'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">
            {t.noReviewsFound || 'No reviews found'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm || ratingFilter !== 'all'
              ? t.tryDifferentFilters || 'Try adjusting your filters'
              : t.noReviewsYet || 'No reviews have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Car Image */}
                {review.car?.imageUrl && (
                  <div className="relative w-full lg:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={review.car.imageUrl}
                      alt={`${review.car.make} ${review.car.model}`}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                )}

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm font-semibold text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {review.title}
                        </h3>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    {/* Car Info */}
                    {review.car && (
                      <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {review.car.make} {review.car.model} {review.car.year}
                          </p>
                          {review.car.licensePlate && (
                            <p className="text-xs text-gray-500">
                              {review.car.licensePlate}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    {review.customer && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {review.customer.firstName && review.customer.lastName
                              ? `${review.customer.firstName} ${review.customer.lastName}`
                              : review.customer.name || 'Anonymous'}
                          </p>
                          {review.bookingReference && (
                            <p className="text-xs text-gray-500">
                              {t.bookingReference || 'Booking'}: {review.bookingReference}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



