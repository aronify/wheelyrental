import { Profile } from '@/types/profile'

/**
 * Dummy profile data for development
 * 
 * TODO: Replace with actual Supabase query
 */
export const dummyProfile: Profile = {
  id: '1',
  userId: 'user-1',
  agencyName: 'Wheely Car Rentals',
  description: 'Premium car rental service offering a wide selection of vehicles for your journey. We pride ourselves on exceptional customer service and well-maintained vehicles.',
  email: 'contact@wheely.com',
  phone: '+355 69 123 4567',
  address: '123 Main Street',
  city: 'Tirana',
  country: 'Albania',
  postalCode: '1001',
  website: 'https://wheely.com',
  taxId: 'AL123456789',
  logo: '',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
}


