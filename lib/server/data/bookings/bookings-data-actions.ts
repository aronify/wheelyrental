'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { BookingStatus } from '@/types/booking'
import { revalidatePath } from 'next/cache'
import { getUserCompanyId } from '@/lib/server/data/company'

export interface BookingActionResult {
  success?: boolean
  error?: string
  data?: unknown
}

function getBookingStart(row: Record<string, unknown>): Date | null {
  const raw = row.start_ts ?? row.start_date_time ?? row.pickup_date
  if (!raw) return null
  const d = new Date(raw as string)
  return isNaN(d.getTime()) ? null : d
}

function getBookingEnd(row: Record<string, unknown>): Date | null {
  const raw = row.end_ts ?? row.end_date_time ?? row.dropoff_date
  if (!raw) return null
  const d = new Date(raw as string)
  return isNaN(d.getTime()) ? null : d
}

function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

/**
 * Server action to update booking status.
 * Allows update when the booking belongs to the user's company (company_id) or user (user_id).
 * Blocks "picked_up" before pickup date and "returned" before return date.
 */
export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
): Promise<BookingActionResult> {
  try {
    const supabase = await createServerActionClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const companyId = await getUserCompanyId(user.id)

    let selectQuery = supabase.from('bookings').select('*').eq('id', bookingId)
    if (companyId) {
      selectQuery = selectQuery.eq('company_id', companyId)
    } else {
      selectQuery = selectQuery.eq('user_id', user.id)
    }

    const { data: existing, error: fetchError } = await selectQuery.single()

    if (fetchError || !existing) {
      return { error: 'Booking not found or access denied' }
    }

    const now = new Date()

    if (status === 'picked_up') {
      const startAt = getBookingStart(existing as Record<string, unknown>)
      if (startAt && now < startOfDay(startAt)) {
        return {
          error: `Pickup date is ${startAt.toLocaleDateString()}. You cannot mark as picked up before 00:00 on that day.`,
        }
      }
    }

    if (status === 'returned') {
      const endAt = getBookingEnd(existing as Record<string, unknown>)
      if (endAt && now < startOfDay(endAt)) {
        return {
          error: `Return date is ${endAt.toLocaleDateString()}. You cannot mark as returned before 00:00 on that day.`,
        }
      }
    }

    let updateQuery = supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (companyId) {
      updateQuery = updateQuery.eq('company_id', companyId)
    } else {
      updateQuery = updateQuery.eq('user_id', user.id)
    }

    const { data, error } = await updateQuery.select().single()

    if (error) {
      return { error: 'Failed to update booking status' }
    }

    revalidatePath('/bookings')
    return { success: true, data }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

