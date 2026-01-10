/**
 * Quick Start Guide Helpers
 * 
 * Utilities to determine onboarding completion status
 * for new partners on the WheelyPartner platform.
 */

import { createServerComponentClient } from '@/lib/supabase/client'

export interface OnboardingStatus {
  isComplete: boolean
  completedSteps: string[]
  totalSteps: number
  progress: number // 0-100
  steps: {
    profileComplete: boolean
    hasLocations: boolean
    hasCars: boolean
  }
}

/**
 * Check comprehensive onboarding status for a company
 * Returns detailed progress information for the Quick Start Guide
 */
export async function getOnboardingStatus(companyId: string): Promise<OnboardingStatus> {
  if (!companyId) {
    return {
      isComplete: false,
      completedSteps: [],
      totalSteps: 3,
      progress: 0,
      steps: {
        profileComplete: false,
        hasLocations: false,
        hasCars: false,
      }
    }
  }

  const supabase = await createServerComponentClient()
  
  // Step 1: Check if company profile has essential information
  const { data: company } = await supabase
    .from('companies')
    .select('name, email, phone, address, city')
    .eq('id', companyId)
    .single()

  const profileComplete = !!(
    company?.name?.trim() &&
    company?.email?.trim() &&
    company?.phone?.trim() &&
    company?.address?.trim() &&
    company?.city?.trim()
  )

  // Step 2: Check if company has at least one active location
  const { data: locations, count: locationCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: false })
    .eq('company_id', companyId)
    .eq('is_active', true)
    .limit(1)

  const hasLocations = (locationCount ?? 0) > 0

  // Step 3: Check if company has at least one active car
  const { data: cars, count: carCount } = await supabase
    .from('cars')
    .select('id', { count: 'exact', head: false })
    .eq('company_id', companyId)
    .eq('status', 'active')
    .limit(1)

  const hasCars = (carCount ?? 0) > 0

  // Calculate progress
  const completedSteps: string[] = []
  if (profileComplete) completedSteps.push('profile')
  if (hasLocations) completedSteps.push('locations')
  if (hasCars) completedSteps.push('cars')

  const totalSteps = 3
  const progress = Math.round((completedSteps.length / totalSteps) * 100)
  const isComplete = completedSteps.length === totalSteps

  return {
    isComplete,
    completedSteps,
    totalSteps,
    progress,
    steps: {
      profileComplete,
      hasLocations,
      hasCars,
    }
  }
}

/**
 * Simple check if onboarding is complete (for quick conditional rendering)
 */
export async function isOnboardingComplete(companyId: string): Promise<boolean> {
  if (!companyId) return false
  
  const status = await getOnboardingStatus(companyId)
  return status.isComplete
}
