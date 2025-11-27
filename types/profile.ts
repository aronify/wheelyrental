/**
 * Profile Types
 * 
 * Types for user/rental agency profile data
 */

export interface Profile {
  id: string
  userId: string
  agencyName: string
  description: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  postalCode: string
  website?: string
  taxId?: string
  logo?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProfileFormData {
  agencyName: string
  description: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  postalCode: string
  website?: string
  taxId?: string
  logoUrl?: string
}

export const emptyProfile: ProfileFormData = {
  agencyName: '',
  description: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  website: '',
  taxId: '',
  logoUrl: '',
}


