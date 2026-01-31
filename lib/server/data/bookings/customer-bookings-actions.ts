'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import type { BookingStatus } from '@/types/booking'

/**
 * CUSTOMER BOOKING DATA ACCESS
 *
 * Authoritative resolution: auth.users.id → public.customers.user_id → customers.id (customer_id).
 * All booking access for the authenticated customer must resolve customer_id first; never query
 * bookings by auth.users.id directly.
 */

export interface CustomerBookingCar {
  id: string
  make: string
  model: string
  year: number
  transmission: string
  fuel_type: string
  daily_rate: number
}

export interface CustomerBookingLocation {
  id: string
  name: string
  city?: string
  country?: string
}

export interface CustomerBookingExtra {
  id: string
  name: string
  price?: number
  unit?: string
}

export interface NormalizedCustomerBooking {
  booking_id: string
  booking_dates: { start: Date; end: Date }
  status: BookingStatus
  total_price: number
  notes?: string
  created_at: Date
  updated_at: Date
  car: CustomerBookingCar | null
  pickup_location: CustomerBookingLocation | { name: string; city?: string; country?: string } | null
  dropoff_location: CustomerBookingLocation | { name: string; city?: string; country?: string } | null
  extras: CustomerBookingExtra[]
}

export interface GetCustomerBookingsResult {
  bookings: NormalizedCustomerBooking[]
  customerNotFound: boolean
  error?: string
}

function parseDate(raw: unknown): Date | null {
  if (raw == null) return null
  const d = new Date(raw as string)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Step 1: Resolve customer ID from authenticated user.
 * Canonical link: public.customers.user_id = auth.users.id → customers.id is customer_id.
 */
export async function resolveCustomerId(authenticatedUserId: string): Promise<string | null> {
  const supabase = await createServerActionClient()
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', authenticatedUserId)
    .limit(1)
    .maybeSingle()

  if (error || !data?.id) {
    return null
  }
  return data.id
}

/**
 * Fetch and enrich customer bookings. Never queries bookings by auth.uid(); always uses
 * resolved customer_id. Returns empty list when customer not found (caller shows empty state).
 */
export async function getCustomerBookings(
  authenticatedUserId: string,
  options?: { limit?: number; offset?: number }
): Promise<GetCustomerBookingsResult> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100)
  const offset = Math.max(options?.offset ?? 0, 0)

  const customerId = await resolveCustomerId(authenticatedUserId)
  if (!customerId) {
    return { bookings: [], customerNotFound: true }
  }

  const supabase = await createServerActionClient()

  const { data: rows, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (bookingsError) {
    return { bookings: [], customerNotFound: false, error: 'Booking data unavailable' }
  }

  const list = (rows ?? []) as Record<string, unknown>[]
  if (list.length === 0) {
    return { bookings: [], customerNotFound: false }
  }

  const carIds = [...new Set(list.map((b) => b.car_id as string).filter(Boolean))]
  const pickupIds = [...new Set(list.map((b) => b.pickup_location_id as string).filter(Boolean))]
  const dropoffIds = [...new Set(list.map((b) => b.dropoff_location_id as string).filter(Boolean))]
  const bookingIds = list.map((b) => b.id as string)

  const safeQuery = <D>(p: PromiseLike<{ data: D; error: unknown }>) =>
    Promise.resolve(p).catch(() => ({ data: [] as D, error: null }))

  const [carsRes, pickupLocRes, dropoffLocRes, extrasRes] = await Promise.all([
    carIds.length
      ? supabase.from('cars').select('id, make, model, year, transmission, fuel_type, daily_rate').in('id', carIds)
      : Promise.resolve({ data: [], error: null }),
    pickupIds.length && (list[0] as any).pickup_location_id != null
      ? safeQuery(supabase.from('locations').select('id, name, city, country').in('id', pickupIds))
      : Promise.resolve({ data: [], error: null }),
    dropoffIds.length && (list[0] as any).dropoff_location_id != null
      ? safeQuery(supabase.from('locations').select('id, name, city, country').in('id', dropoffIds))
      : Promise.resolve({ data: [], error: null }),
    safeQuery(supabase.from('booking_extras').select('*').in('booking_id', bookingIds)),
  ])

  const carsMap = new Map(
    (carsRes.data ?? []).map((c: any) => [
      c.id,
      {
        id: c.id,
        make: c.make ?? '',
        model: c.model ?? '',
        year: Number(c.year ?? 0),
        transmission: c.transmission ?? '',
        fuel_type: c.fuel_type ?? '',
        daily_rate: Number(c.daily_rate ?? 0),
      },
    ])
  )
  const pickupMap = new Map(
    (pickupLocRes.data ?? []).map((l: any) => [
      l.id,
      { id: l.id, name: l.name ?? '', city: l.city, country: l.country },
    ])
  )
  const dropoffMap = new Map(
    (dropoffLocRes.data ?? []).map((l: any) => [
      l.id,
      { id: l.id, name: l.name ?? '', city: l.city, country: l.country },
    ])
  )
  const extrasByBooking = new Map<string, CustomerBookingExtra[]>()
  if (extrasRes.data?.length) {
    for (const e of extrasRes.data as any[]) {
      const bid = e.booking_id
      if (!bid) continue
      const arr = extrasByBooking.get(bid) ?? []
      arr.push({
        id: e.id ?? bid,
        name: e.name ?? e.extra_name ?? 'Extra',
        price: e.price != null ? Number(e.price) : undefined,
        unit: e.unit,
      })
      extrasByBooking.set(bid, arr)
    }
  }

  const bookings: NormalizedCustomerBooking[] = list.map((b) => {
    const startRaw = b.start_ts ?? b.start_date_time ?? b.pickup_date
    const endRaw = b.end_ts ?? b.end_date_time ?? b.dropoff_date
    const start = parseDate(startRaw) ?? new Date()
    const end = parseDate(endRaw) ?? new Date()
    const pickupId = b.pickup_location_id as string | undefined
    const dropoffId = b.dropoff_location_id as string | undefined
    let pickup_location: NormalizedCustomerBooking['pickup_location'] = null
    let dropoff_location: NormalizedCustomerBooking['dropoff_location'] = null
    if (pickupId && pickupMap.has(pickupId)) {
      pickup_location = pickupMap.get(pickupId)! as CustomerBookingLocation
    } else if (b.pickup_location != null) {
      const pl = b.pickup_location as string | Record<string, unknown>
      pickup_location =
        typeof pl === 'string'
          ? { name: pl, city: undefined, country: undefined }
          : { name: (pl.name as string) ?? '', city: pl.city as string, country: pl.country as string }
    }
    if (dropoffId && dropoffMap.has(dropoffId)) {
      dropoff_location = dropoffMap.get(dropoffId)! as CustomerBookingLocation
    } else if (b.dropoff_location != null) {
      const dl = b.dropoff_location as string | Record<string, unknown>
      dropoff_location =
        typeof dl === 'string'
          ? { name: dl, city: undefined, country: undefined }
          : { name: (dl.name as string) ?? '', city: dl.city as string, country: dl.country as string }
    }

    return {
      booking_id: b.id as string,
      booking_dates: { start, end },
      status: (b.status as BookingStatus) ?? 'pending',
      total_price: Number(b.total_price ?? 0),
      notes: b.notes as string | undefined,
      created_at: parseDate(b.created_at) ?? new Date(),
      updated_at: parseDate(b.updated_at) ?? new Date(),
      car: carsMap.get(b.car_id as string) ?? null,
      pickup_location,
      dropoff_location,
      extras: extrasByBooking.get(b.id as string) ?? [],
    }
  })

  return { bookings, customerNotFound: false }
}

