import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/client'
import ReviewsList from '@/app/components/domain/reviews/reviews-list'
import DashboardHeader from '@/app/components/domain/dashboard/dashboard-header'
import QuickAccessMenu from '@/app/components/ui/navigation/quick-access-menu'
import { Review } from '@/types/review'
import { getUserCompanyId } from '@/lib/server/data/company-helpers'

/**
 * Reviews Page
 * 
 * Displays all reviews for the partner's cars.
 * Reviews are read-only and linked to completed bookings.
 * Authenticated users can access this page.
 * Unauthenticated users are redirected to the login page.
 */
export default async function ReviewsPage() {
  const supabase = await createServerComponentClient()
  
  // Check authentication using getUser() for security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Fetch profile for header
  let profileData: { agency_name?: string; logo?: string } | null = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('agency_name, logo')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        profileData = null
      } else if (error.code && error.message) {
        console.error('Error fetching profile:', {
          message: error.message,
          code: error.code,
        })
      }
    } else if (data) {
      profileData = data
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message) {
      console.error('Unexpected error fetching profile:', {
        message: err.message,
        name: err.name,
      })
    }
  }

  // Get user's company_id
  const companyId = await getUserCompanyId(user.id)
  
  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          userEmail={user.email || ''} 
          agencyName={profileData?.agency_name}
          agencyLogo={profileData?.logo}
        />
        <QuickAccessMenu />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No company found. Please create a company first.</p>
          </div>
        </main>
      </div>
    )
  }

  // Fetch reviews for the company's cars
  // Reviews are company-scoped and read-only
  const { data: dbReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      car:cars(
        id,
        make,
        model,
        year,
        license_plate,
        image_url
      ),
      customer:customers(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      booking:bookings(
        id,
        booking_reference,
        start_ts,
        end_ts,
        status
      )
    `)
    .eq('company_id', companyId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (reviewsError) {
    console.error('Error fetching reviews:', {
      message: reviewsError.message,
      code: reviewsError.code,
    })
  }

  // Convert snake_case to camelCase and map to Review type
  const reviews: Review[] = (dbReviews || []).map((review: any) => ({
    id: review.id,
    bookingId: review.booking_id,
    bookingReference: review.booking_reference,
    customerId: review.customer_id,
    carId: review.car_id,
    companyId: review.company_id,
    rating: review.rating,
    title: review.title || undefined,
    comment: review.comment || undefined,
    isVisible: review.is_visible,
    createdAt: new Date(review.created_at),
    updatedAt: new Date(review.updated_at),
    car: review.car ? {
      id: review.car.id,
      companyId: review.company_id,
      make: review.car.make || '',
      model: review.car.model || '',
      year: review.car.year || new Date().getFullYear(),
      licensePlate: review.car.license_plate || '',
      imageUrl: review.car.image_url || undefined,
      transmission: 'automatic' as const,
      fuelType: 'petrol' as const,
      seats: 5,
      dailyRate: 0,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    customer: review.customer ? {
      id: review.customer.id,
      firstName: review.customer.first_name || '',
      lastName: review.customer.last_name || '',
      email: review.customer.email || '',
      phone: review.customer.phone || '',
    } : undefined,
    booking: review.booking ? {
      id: review.booking.id,
      bookingReference: review.booking.booking_reference,
      companyId: review.company_id,
      carId: review.car_id,
      customerId: review.customer_id,
      pickupLocationId: '',
      dropoffLocationId: '',
      startTs: new Date(review.booking.start_ts),
      endTs: new Date(review.booking.end_ts),
      totalPrice: 0,
      status: review.booking.status as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userEmail={user.email || ''} 
        agencyName={profileData?.agency_name}
        agencyLogo={profileData?.logo}
      />
      <QuickAccessMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <ReviewsList initialReviews={reviews} />
      </main>
    </div>
  )
}


