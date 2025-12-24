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
  
  // First, try to get from companies table using owner_id
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()
  
  if (company?.id) {
    return company.id
  }
  
  // Fallback: Get company_id from any car owned by the user
  // This assumes all cars belong to the same company for a user
  const { data: car } = await supabase
    .from('cars')
    .select('company_id')
    .limit(1)
    .maybeSingle()
  
  return car?.company_id || null
}

/**
 * Ensure a company exists for the user, creating one if it doesn't exist
 * Returns the company_id
 */
export async function ensureUserCompany(userId: string, userEmail?: string | null): Promise<string | null> {
  if (!userId) {
    return null
  }

  const supabase = await createServerComponentClient()
  
  // Check if user already has a company
  const existingCompanyId = await getUserCompanyId(userId)
  if (existingCompanyId) {
    return existingCompanyId
  }

  // Create a new company for the user
  const companyName = userEmail 
    ? `Company for ${userEmail.split('@')[0]}`
    : `Company for User ${userId.substring(0, 8)}`

  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      legal_name: companyName,
      email: userEmail || null,
      owner_id: userId, // Set owner_id directly on insert
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

  const companyId = newCompany.id

  // owner_id is already set on insert, so no need to update
  // Just return the company ID
  return companyId
}

/**
 * Check if company has minimal required data (name, email, phone)
 * Returns true if company has at least name, email, and phone filled in
 */
export async function companyHasMinimalData(companyId: string): Promise<boolean> {
  if (!companyId) {
    return false
  }

  const supabase = await createServerComponentClient()
  
  const { data: company } = await supabase
    .from('companies')
    .select('name, email, phone')
    .eq('id', companyId)
    .single()

  if (!company) {
    return false
  }

  // Check if all three required fields are filled
  return !!(
    company.name?.trim() &&
    company.email?.trim() &&
    company.phone?.trim()
  )
}

/**
 * Get company data for the authenticated user
 */
export async function getUserCompany(userId: string) {
  const companyId = await getUserCompanyId(userId)
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
 * Verify user has access to a company (for RLS and access control)
 */
export async function userHasCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  const userCompanyId = await getUserCompanyId(userId)
  return userCompanyId === companyId
}

