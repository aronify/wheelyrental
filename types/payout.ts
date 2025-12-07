/**
 * Payout Request Types
 * 
 * TypeScript definitions for payout request data structures.
 */

export type PayoutRequestStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'confirmed'

export interface PayoutRequest {
  id: string
  userId: string
  invoiceUrl: string
  amount?: number
  description?: string
  status: PayoutRequestStatus
  adminNotes?: string
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PayoutRequestFormData {
  invoiceUrl: string
  amount?: number
  description?: string
}

