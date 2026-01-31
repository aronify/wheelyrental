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
 * Get all payout requests for the authenticated user.
 * Query: payout_requests WHERE user_id = auth.uid(), ORDER BY created_at DESC.
 * Backend enforces user_id; RLS must restrict by user_id.
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
      .select('id, user_id, company_id, invoice_url, amount, description, status, admin_notes, processed_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message || 'Failed to fetch payout requests' }
    }

    return { success: true, data: data ?? [] }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

/**
 * Get company balance (available_balance, pending_payout_amount) from companies table.
 * Uses the company where owner_id = current user.
 */
export async function getBalanceAction(): Promise<
  | { success: true; availableBalance: number; pendingPayoutAmount: number }
  | { error: string }
> {
  try {
    const supabase = await createServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }
    const { data, error } = await supabase
      .from('companies')
      .select('available_balance, pending_payout_amount')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (error) {
      console.error('[getBalanceAction]', error.message)
      return { error: 'Failed to load balance' }
    }
    if (!data) {
      return { success: true, availableBalance: 0, pendingPayoutAmount: 0 }
    }
    const availableBalance = Number(data.available_balance ?? 0)
    const pendingPayoutAmount = Number(data.pending_payout_amount ?? 0)
    return { success: true, availableBalance, pendingPayoutAmount }
  } catch (e) {
    console.error('[getBalanceAction]', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Create a payout from company balance (atomic: deducts companies.available_balance, creates payout_requests).
 * Uses create_payout_from_company_balance RPC. Fails if requested amount exceeds available balance.
 */
export async function createPayoutFromBalanceAction(
  requestedAmount: number,
  invoiceUrl?: string,
  description?: string | null
): Promise<PayoutActionResult> {
  try {
    const supabase = await createServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated. Please log in again.' }
    }
    if (!requestedAmount || requestedAmount <= 0) {
      return { error: 'Amount must be greater than 0.' }
    }
    const { data: payoutId, error } = await supabase.rpc('create_payout_from_company_balance', {
      p_user_id: user.id,
      p_requested_amount: requestedAmount,
      p_invoice_url: invoiceUrl ?? '',
      p_description: description ?? null,
    })
    if (error) {
      if (error.message?.toLowerCase().includes('exceeds available balance')) {
        return { error: 'Payout exceeds available balance.' }
      }
      if (error.message?.toLowerCase().includes('no company found')) {
        return { error: 'No company linked to your account. Complete profile setup first.' }
      }
      console.error('[createPayoutFromBalanceAction]', error.message)
      return { error: 'Unable to create payout. Please check your balance and try again.' }
    }
    revalidatePath('/payouts')
    return { success: true, message: 'Payout request submitted.', data: { id: payoutId } }
  } catch (e) {
    console.error('[createPayoutFromBalanceAction]', e)
    return { error: 'An unexpected error occurred.' }
  }
}

/**
 * Submit payout from balance via form: uploads optional invoice, then creates payout from balance.
 */
export async function submitPayoutFromBalanceAction(formData: FormData): Promise<PayoutActionResult> {
  try {
    const supabase = await createServerActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated. Please log in again.' }
    }
    const amountRaw = formData.get('amount')
    const amount = amountRaw ? parseFloat(String(amountRaw).trim()) : 0
    const description = (formData.get('description') as string)?.trim() || null
    const invoiceFile = formData.get('invoice') as File | null

    if (!amount || amount <= 0) {
      return { error: 'Enter a valid amount.' }
    }

    let invoiceUrl = ''
    if (invoiceFile && invoiceFile.size > 0) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(invoiceFile.type)) {
        return { error: 'Invalid file type. Please upload a PDF, JPG, or PNG file.' }
      }
      const maxSize = 10 * 1024 * 1024
      if (invoiceFile.size > maxSize) {
        return { error: 'File is too large. Maximum size is 10MB.' }
      }
      const fileExt = invoiceFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const arrayBuffer = await invoiceFile.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, arrayBuffer, { cacheControl: '3600', upsert: false, contentType: invoiceFile.type })
      if (uploadError) {
        return { error: `Failed to upload invoice: ${uploadError.message}` }
      }
      invoiceUrl = fileName
    }

    return createPayoutFromBalanceAction(amount, invoiceUrl, description)
  } catch (e) {
    console.error('[submitPayoutFromBalanceAction]', e)
    return { error: 'An unexpected error occurred.' }
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
