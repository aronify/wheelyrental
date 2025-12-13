'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { PayoutRequestFormData } from '@/types/payout'
import { revalidatePath } from 'next/cache'

export interface PayoutActionResult {
  success?: boolean
  error?: string
  message?: string
  data?: unknown
}

/**
 * Submit a payout request with invoice upload
 */
export async function submitPayoutRequestAction(
  formData: FormData
): Promise<PayoutActionResult> {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated. Please log in again.' }
    }

    // Get form data
    const invoiceFile = formData.get('invoice') as File | null
    const amount = formData.get('amount') ? parseFloat(formData.get('amount') as string) : null
    const description = formData.get('description') as string | null

    if (!invoiceFile || invoiceFile.size === 0) {
      return { error: 'Invoice file is required' }
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(invoiceFile.type)) {
      return { error: 'Invalid file type. Please upload a PDF, JPG, or PNG file.' }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (invoiceFile.size > maxSize) {
      return { error: 'File is too large. Maximum size is 10MB.' }
    }

    // Upload invoice to Supabase Storage
    const fileExt = invoiceFile.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await invoiceFile.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, arrayBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: invoiceFile.type
      })

    if (uploadError) {
      return { error: `Failed to upload invoice: ${uploadError.message}` }
    }

    // Store the file path instead of URL (we'll generate signed URLs when needed)
    // For private buckets, we need to use signed URLs
    const invoiceUrl = fileName

    // Create payout request in database
    const { data, error } = await supabase
      .from('payout_requests')
      .insert({
        user_id: user.id,
        invoice_url: invoiceUrl,
        amount: amount,
        description: description || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      // If database insert fails, try to delete the uploaded file
      await supabase.storage
        .from('invoices')
        .remove([fileName])
      
      return { 
        error: `Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`
      }
    }

    revalidatePath('/payouts')
    return { success: true, message: 'Payout request submitted successfully', data }
  } catch (error: unknown) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * Get all payout requests for the current user
 */
export async function getPayoutRequestsAction() {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch payout requests' }
    }

    return { success: true, data }
  } catch (error: unknown) {
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get signed URL for an invoice file
 */
export async function getInvoiceSignedUrlAction(invoiceUrlOrPath: string) {
  try {
    const supabase = await createServerActionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Extract file path from URL if it's a full URL, otherwise use as-is
    let filePath = invoiceUrlOrPath
    if (invoiceUrlOrPath.includes('/storage/v1/object/public/invoices/')) {
      // Extract path from public URL (for old records)
      const urlParts = invoiceUrlOrPath.split('/storage/v1/object/public/invoices/')
      filePath = urlParts[1] || invoiceUrlOrPath
    } else if (invoiceUrlOrPath.includes('/storage/v1/object/sign/invoices/')) {
      // Extract path from signed URL
      const urlParts = invoiceUrlOrPath.split('/storage/v1/object/sign/invoices/')
      filePath = urlParts[1]?.split('?')[0] || invoiceUrlOrPath
    }

    // Verify the file belongs to this user
    if (!filePath.startsWith(user.id + '/')) {
      return { error: 'Unauthorized access' }
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      return { error: 'Failed to generate signed URL' }
    }

    return { success: true, url: data.signedUrl }
  } catch (error: unknown) {
    return { error: 'An unexpected error occurred' }
  }
}
