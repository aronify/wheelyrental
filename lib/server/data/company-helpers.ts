'use server'

import { createServerComponentClient } from '@/lib/supabase/client'

/**
 * Get the company_id for the authenticated user
 * First tries to get from company_members table (preferred method)
 * Falls back to getting from user's cars if no company_members record exists
 * If user has no company association, returns null
 */
export async function getUserCompanyId(userId?: string): Promise<string | null> {
  if (!userId) {
    return null
  }

  const supabase = await createServerComponentClient()
  
  // First, try to get from company_members (preferred method)
  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single()
  
  if (member?.company_id) {
    return member.company_id
  }
  
  // Fallback: Get company_id from any car owned by the user
  // This assumes all cars belong to the same company for a user
  const { data: car } = await supabase
    .from('cars')
    .select('company_id')
    .eq('owner_id', userId)
    .limit(1)
    .single()
  
  return car?.company_id || null
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

