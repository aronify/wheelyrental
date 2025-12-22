'use server'

import { createServerActionClient } from '@/lib/supabase/client'
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

    // Check authentication using getUser() for security
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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

    // Check if profiles table exists, if not, update company directly
    // First try to update profile, if table doesn't exist, update company instead
    const { error: profileError } = await supabase
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
      .eq('user_id', user.id)

    // If profiles table doesn't exist, update company directly
    if (profileError && (profileError.code === 'PGRST204' || profileError.message?.includes('schema cache'))) {
      // Profiles table doesn't exist, update company directly
      // Get user's company_id
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .eq('is_active', true)
        .single()

      let companyId = companyMember?.company_id

      // If no company exists, create one
      if (!companyId) {
        // Create a new company
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: profileData.agencyName || 'My Company',
            legal_name: profileData.agencyName || 'My Company',
            description: profileData.description || '',
            email: profileData.email || user.email || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            city: profileData.city || '',
            country: profileData.country || 'Albania',
            postal_code: profileData.postalCode || '',
            website: profileData.website || '',
            tax_id: profileData.taxId || '',
            logo: profileData.logoUrl || '',
            verification_status: 'pending',
          })
          .select('id')
          .single()

        if (createError || !newCompany) {
          console.error('Company creation error:', {
            message: createError?.message,
            code: createError?.code,
            details: createError?.details,
            hint: createError?.hint,
          })
          return {
            error: createError?.message || 'Failed to create company. Please try again.',
          }
        }

        companyId = newCompany.id

        // Add user as company owner
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            company_id: companyId,
            user_id: user.id,
            role: 'owner',
            is_active: true,
          })

        if (memberError) {
          console.error('Company member creation error:', {
            message: memberError.message,
            code: memberError.code,
            details: memberError.details,
            hint: memberError.hint,
          })
          // Continue anyway - the company was created
        }
      }

      // Update the company
      if (companyId) {
        const { error: companyError } = await supabase
          .from('companies')
          .update({
            name: profileData.agencyName,
            legal_name: profileData.agencyName,
            description: profileData.description,
            email: profileData.email,
            phone: profileData.phone,
            address: profileData.address,
            city: profileData.city,
            country: profileData.country,
            postal_code: profileData.postalCode,
            website: profileData.website,
            tax_id: profileData.taxId,
            logo: profileData.logoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId)

        if (companyError) {
          console.error('Company update error:', {
            message: companyError.message,
            code: companyError.code,
            details: companyError.details,
            hint: companyError.hint,
          })
          return {
            error: companyError.message || 'Failed to update profile. Please try again.',
          }
        }
      } else {
        return {
          error: 'Failed to create or find company. Please try again.',
        }
      }
    } else if (profileError) {
      console.error('Profile update error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      })
      return {
        error: profileError.message || 'Failed to update profile. Please try again.',
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


