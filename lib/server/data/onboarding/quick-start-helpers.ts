/**
 * Quick Start Guide Helpers
 * Utilities to determine onboarding completion status for new partners.
 */

import { createServerComponentClient } from '@/lib/supabase/client'

export interface OnboardingStatus {
  isComplete: boolean
  completedSteps: string[]
  totalSteps: number
  progress: number
  steps: {
    profileComplete: boolean
    hasLocations: boolean
    hasCars: boolean
  }
}

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

  const { data: locations, count: locationCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: false })
    .eq('is_active', true)
    .limit(1)

  const hasLocations = (locationCount ?? 0) > 0

  const { data: cars, count: carCount } = await supabase
    .from('cars')
    .select('id', { count: 'exact', head: false })
    .eq('status', 'active')
    .limit(1)

  const hasCars = (carCount ?? 0) > 0

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

export async function isOnboardingComplete(companyId: string): Promise<boolean> {
  if (!companyId) return false
  const status = await getOnboardingStatus(companyId)
  return status.isComplete
}
