'use server'

import { createServerActionClient } from '@/lib/supabaseClient'
import { BookingStatus } from '@/types/booking'
import { revalidatePath } from 'next/cache'

export interface BookingActionResult {
  success?: boolean
  error?: string
  data?: unknown
}

/**
 * Server action to update booking status
 */
export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
): Promise<BookingActionResult> {
  try {
    const supabase = await createServerActionClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return {
        error: 'Not authenticated',
      }
    }

    // Update booking status
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('owner_id', session.user.id) // Ensure user owns this booking
      .select()
      .single()

    if (error) {
      return {
        error: 'Failed to update booking status',
      }
    }

    // Revalidate the bookings page
    revalidatePath('/bookings')

    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

