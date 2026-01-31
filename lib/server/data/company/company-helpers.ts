'use server'

import { createServerComponentClient } from '@/lib/supabase/client'

/**
 * Get the company_id for the authenticated user
 * Gets from companies table using owner_id column
 * Falls back to getting from user's cars if no owner_id match exists
 * If user has no company association, returns null
 */
export async function getUserCompanyId(userId?: string): Promise<string | null> {
  if (!userId) {
    return null
  }

  const supabase = await createServerComponentClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  if (company?.id) {
    return company.id
  }

  console.error('[SECURITY] No company found for user via owner_id:', userId)
  return null
}

/**
 * Ensure a company exists for the user, creating one if it doesn't exist
 */
export async function ensureUserCompany(userId: string, userEmail?: string | null): Promise<string | null> {
  if (!userId) {
    return null
  }

  const supabase = await createServerComponentClient()
  const existingCompanyId = await getUserCompanyId(userId)
  if (existingCompanyId) {
    return existingCompanyId
  }

  const companyName = userEmail
    ? `Company for ${userEmail.split('@')[0]}`
    : `Company for User ${userId.substring(0, 8)}`

  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      legal_name: companyName,
      email: userEmail || null,
      owner_id: userId,
      verification_status: 'pending',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
    })
    .select('id')
    .single()

  if (companyError || !newCompany) {
    console.error('Error creating company:', companyError)
    return null
  }

  return newCompany.id
}

/**
 * Check if company has minimal required data (name, email, phone)
 */
export async function companyHasMinimalData(companyId: string): Promise<boolean> {
  if (!companyId) return false

  const supabase = await createServerComponentClient()
  const { data: company } = await supabase
    .from('companies')
    .select('name, email, phone')
    .eq('id', companyId)
    .single()

  if (!company) return false
  return !!(company.name?.trim() && company.email?.trim() && company.phone?.trim())
}

/**
 * Get company by ID (single query). Use when you already have companyId.
 */
export async function getCompanyById(companyId: string) {
  if (!companyId) return null
  const supabase = await createServerComponentClient()
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()
  return company
}

/**
 * Get company data for the authenticated user.
 * Pass companyId when already known to avoid an extra getUserCompanyId round-trip.
 */
export async function getUserCompany(userId: string, companyId?: string | null) {
  const id = companyId ?? (await getUserCompanyId(userId))
  if (!id) return null
  return getCompanyById(id)
}

/**
 * Verify user has access to a company
 */
export async function userHasCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  const userCompanyId = await getUserCompanyId(userId)
  return userCompanyId === companyId
}
