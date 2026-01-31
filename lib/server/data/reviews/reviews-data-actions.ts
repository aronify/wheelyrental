'use server'

import { createServerComponentClient } from '@/lib/supabase/client'
import { Review } from '@/types/review'

export interface ReviewStats {
  averageRating: number
  reviewCount: number
}

export interface CarReviewsResult {
  success: boolean
  error?: string
  reviews?: Review[]
  stats?: ReviewStats
}

/**
 * Fetch reviews for a specific car
 * Filters by car_id and is_visible = true
 * Returns reviews with stats (average rating, count)
 */
export async function getCarReviewsAction(carId: string): Promise<CarReviewsResult> {
  try {
    if (!carId) {
      return { success: false, error: 'Car ID is required' }
    }

    const supabase = await createServerComponentClient()

    // Fetch reviews by car_id, only visible ones
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        booking_id,
        booking_reference,
        customer_id,
        car_id,
        company_id,
        rating,
        title,
        comment,
        is_visible,
        created_at,
        updated_at
      `)
      .eq('car_id', carId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('[getCarReviewsAction] Error fetching reviews:', reviewsError)
      return { success: false, error: reviewsError.message }
    }

    const reviews: Review[] = (reviewsData || []).map((r: any) => ({
      id: r.id,
      bookingId: r.booking_id,
      bookingReference: r.booking_reference,
      customerId: r.customer_id,
      carId: r.car_id,
      companyId: r.company_id,
      rating: r.rating,
      title: r.title || undefined,
      comment: r.comment || undefined,
      isVisible: r.is_visible,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    }))

    // Calculate stats
    const stats: ReviewStats = {
      reviewCount: reviews.length,
      averageRating: reviews.length > 0 
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0,
    }

    return {
      success: true,
      reviews,
      stats,
    }
  } catch (error) {
    console.error('[getCarReviewsAction] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reviews',
    }
  }
}
