/**
 * Company Types
 * 
 * TypeScript definitions for company/partner data structures.
 */

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended'

// Note: Actual schema uses is_verified boolean, but we keep this type for compatibility
export type CompanyMemberRole = 'owner' | 'admin' | 'member'

export interface Company {
  id: string
  name: string
  legalName?: string
  email?: string
  phone?: string
  website?: string
  isVerified: boolean // Actual schema uses boolean, not enum
  createdAt: Date
  updatedAt: Date
  // Computed/display fields
  verificationStatus?: VerificationStatus // Derived from isVerified
}

export interface CompanyMember {
  id: string
  companyId: string
  userId: string
  role: CompanyMemberRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}


