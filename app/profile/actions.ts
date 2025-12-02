'use server'

import { createServerActionClient } from '@/lib/supabaseClient'
import { ProfileFormData } from '@/types/profile'
import { revalidatePath } from 'next/cache'

export interface ProfileUpdateResult {
  success?: boolean
  error?: string
  message?: string
}

/**
 * Server action to update user profile in Supabase
 */
export async function updateProfileAction(
  profileData: ProfileFormData
): Promise<ProfileUpdateResult> {
  try {
    const supabase = await createServerActionClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return {
        error: 'Not authenticated',
      }
    }

    // Validate required fields
    if (!profileData.agencyName || !profileData.email || !profileData.phone) {
      return {
        error: 'Please fill in all required fields',
      }
    }

    // Update profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        agency_name: profileData.agencyName,
        description: profileData.description,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        country: profileData.country,
        postal_code: profileData.postalCode,
        website: profileData.website,
        tax_id: profileData.taxId,
        logo: profileData.logoUrl, // Database column is 'logo' not 'logo_url'
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)

    if (error) {
      return {
        error: 'Failed to update profile. Please try again.',
      }
    }

    // Revalidate the profile page to show updated data
    revalidatePath('/profile')

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  } catch (error: unknown) {
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}


