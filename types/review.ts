/**
 * Review Types
 * 
 * TypeScript definitions for review data structures.
 */

import { Car } from './car'
import { Customer } from './customer'
import { Booking } from './booking'

export interface Review {
  id: string
  bookingId: string
  bookingReference: string
  customerId: string
  carId: string
  companyId: string
  rating: number // 1-5
  title?: string
  comment?: string
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
  // Joined data
  car?: Car
  customer?: Customer
  booking?: Booking
}

/**
 * Helper function to filter reviews by rating
 */
export function filterReviewsByRating(
  reviews: Review[],
  minRating: number
): Review[] {
  return reviews.filter((review) => review.rating >= minRating)
}

/**
 * Helper function to search reviews by customer name or car
 */
export function searchReviews(
  reviews: Review[],
  searchTerm: string
): Review[] {
  if (!searchTerm.trim()) {
    return reviews
  }

  const term = searchTerm.toLowerCase()
  return reviews.filter(
    (review) =>
      review.customer?.name?.toLowerCase().includes(term) ||
      (review.customer?.firstName?.toLowerCase().includes(term) ?? false) ||
      (review.customer?.lastName?.toLowerCase().includes(term) ?? false) ||
      review.car?.make?.toLowerCase().includes(term) ||
      review.car?.model?.toLowerCase().includes(term) ||
      review.bookingReference?.toLowerCase().includes(term) ||
      review.title?.toLowerCase().includes(term) ||
      review.comment?.toLowerCase().includes(term)
  )
}

/**
 * Helper function to get average rating
 */
export function getAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}


