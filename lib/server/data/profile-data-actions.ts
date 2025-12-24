'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { ProfileFormData } from '@/types/profile'
import { revalidatePath } from 'next/cache'
import { withTimeout, withSupabaseTimeout, TIMEOUTS, TimeoutError } from '@/lib/utils/timeout'

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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:16',message:'updateProfileAction entry',data:{hasAgencyName:!!profileData.agencyName,hasEmail:!!profileData.email,hasPhone:!!profileData.phone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const supabase = await createServerActionClient()

    // Check authentication using getUser() for security - with timeout
    const {
      data: { user },
      error: authError,
    } = await withTimeout(
      supabase.auth.getUser(),
      TIMEOUTS.AUTH_CHECK,
      'Authentication check timed out. Please try again.'
    )

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:25',message:'getUser result',data:{hasUser:!!user,userId:user?.id,userEmail:user?.email,authError:authError?.message,authErrorCode:authError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!user) {
      return {
        error: 'Not authenticated',
      }
    }

    // Validate required fields (phone is optional on first save, but becomes required once set)
    if (!profileData.agencyName || !profileData.email) {
      return {
        error: 'Please fill in all required fields (Agency Name and Email)',
      }
    }

    // Try to update profile first (if table exists) - with timeout
    const { error: profileError } = await withSupabaseTimeout(
      supabase
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
        .eq('user_id', user.id),
      TIMEOUTS.UPDATE,
      'Failed to update profile. The request timed out. Please try again.'
    )
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:58',message:'Profile update attempt',data:{hasError:!!profileError,errorCode:profileError?.code,errorMessage:profileError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Always update company (regardless of profile update result)
    // This ensures company data is always synced
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:65',message:'Starting company update process',data:{profileErrorCode:profileError?.code,willUpdateCompany:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Get user's company_id and update company
    // Profiles table doesn't exist OR profile update succeeded - update company directly
    // Get user's company_id - use helper function or query company_members
    let companyId: string | null = null
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:68',message:'Starting company lookup',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Try to get from companies table using owner_id - with timeout
      const { data: company, error: companyQueryError } = await withSupabaseTimeout(
        supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle(),
        TIMEOUTS.QUERY,
        'Failed to retrieve company information. Please try again.'
      )

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:75',message:'Company query result',data:{hasCompany:!!company,companyId:company?.id,hasError:!!companyQueryError,errorCode:companyQueryError?.code,errorMessage:companyQueryError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (companyQueryError) {
        console.error('Error querying companies:', {
          message: companyQueryError.message,
          code: companyQueryError.code,
          details: companyQueryError.details,
        })
      }

      companyId = company?.id || null
      
      // If no company from members, try to find any company for this user
      if (!companyId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:88',message:'No company from members, checking cars',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Try to get company_id from cars table - with timeout
        const { data: userCar } = await withSupabaseTimeout(
          supabase
            .from('cars')
            .select('company_id')
            .eq('company_id', user.id) // This is wrong - should be checking if user owns the car
            .limit(1)
            .maybeSingle(),
          TIMEOUTS.QUERY,
          'Failed to retrieve company information. Please try again.'
        )
        
        companyId = userCar?.company_id || null
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:98',message:'Car lookup result',data:{hasCar:!!userCar,companyIdFromCar:userCar?.company_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:129',message:'Company lookup complete',data:{userId:user.id,companyId,hasCompany:!!company},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      console.log('Company lookup:', {
        userId: user.id,
        companyId,
        company: company,
        error: companyQueryError,
      })

      // If no company exists, create one
      if (!companyId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:137',message:'No companyId found, creating new company',data:{userId:user.id,agencyName:profileData.agencyName},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        
        // Create a new company with owner_id set - with timeout
        const { data: newCompany, error: createError } = await withSupabaseTimeout(
          supabase
            .from('companies')
            .insert({
              name: profileData.agencyName || 'My Company',
              legal_name: profileData.agencyName || 'My Company',
              description: profileData.description || null,
              email: profileData.email || user.email || null,
              phone: profileData.phone || null,
              address: profileData.address || null,
              city: profileData.city || null,
              country: profileData.country || 'Albania',
              postal_code: profileData.postalCode || null,
              website: profileData.website || null,
              tax_id: profileData.taxId || null,
              logo: profileData.logoUrl || null,
              owner_id: user.id, // Set owner_id directly on insert
              verification_status: 'pending',
            })
            .select('id')
            .single(),
          TIMEOUTS.INSERT,
          'Failed to create company. The request timed out. Please try again.'
        )

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:160',message:'Company creation result',data:{hasError:!!createError,errorCode:createError?.code,errorMessage:createError?.message,hasCompany:!!newCompany,companyId:newCompany?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H'})}).catch(()=>{});
        // #endregion

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

        // Set user as company owner by updating owner_id - with timeout
        if (companyId) {
          const { error: ownerError } = await withSupabaseTimeout(
            supabase
              .from('companies')
              .update({ owner_id: user.id })
              .eq('id', companyId),
            TIMEOUTS.UPDATE,
            'Failed to update company owner. Please try again.'
          )

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:185',message:'Company owner update result',data:{hasError:!!ownerError,errorCode:ownerError?.code,errorMessage:ownerError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H'})}).catch(()=>{});
          // #endregion

          if (ownerError) {
            console.error('Company owner update error:', {
              message: ownerError.message,
              code: ownerError.code,
              details: ownerError.details,
              hint: ownerError.hint,
            })
            // Continue anyway - the company was created
          }
        }
      }

      // Update the company directly (RLS is off, so this should work)
      if (companyId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:150',message:'Before company update',data:{companyId,userId:user.id,userEmail:user.email,updateData:{name:profileData.agencyName,email:profileData.email,phone:profileData.phone}},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Get current company data to check if phone is already set and if owner_id is set - with timeout
        const { data: currentCompany } = await withSupabaseTimeout(
          supabase
            .from('companies')
            .select('phone, owner_id')
            .eq('id', companyId)
            .single(),
          TIMEOUTS.QUERY,
          'Failed to retrieve company information. Please try again.'
        )
        
        // Verify user has access to this company
        // If company has owner_id set, it must match current user
        if (currentCompany?.owner_id && currentCompany.owner_id !== user.id) {
          return {
            error: 'You do not have permission to update this company.',
          }
        }
        
        // Direct update (RLS is disabled)
        // IMPORTANT: If phone is already set in DB, do NOT update it (write-once protection)
        // IMPORTANT: Set owner_id ONLY if it's NULL (first time setting)
        const updatePayload: Record<string, any> = {
          name: profileData.agencyName,
          legal_name: profileData.agencyName,
          description: profileData.description || null,
          email: profileData.email || null,
          // Only set phone if it's currently NULL in DB (first time setting)
          // If phone already exists, exclude it from update payload
          ...(currentCompany?.phone ? {} : { phone: profileData.phone || null }),
          address: profileData.address || null,
          city: profileData.city || null,
          country: profileData.country || null,
          postal_code: profileData.postalCode || null,
          website: profileData.website || null,
          tax_id: profileData.taxId || null,
          logo: profileData.logoUrl || null,
        }
        
        // Only set owner_id if it's currently NULL (first time setting)
        // This ensures the company is linked to the user
        // The trigger will prevent if user already owns another company
        if (!currentCompany?.owner_id) {
          updatePayload.owner_id = user.id
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:165',message:'Update payload prepared',data:{companyId,payloadKeys:Object.keys(updatePayload),payloadValues:Object.values(updatePayload).filter(v=>v!==null).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        const { error: companyError, data: updateData, count } = await withSupabaseTimeout(
          supabase
            .from('companies')
            .update(updatePayload)
            .eq('id', companyId)
            .select(),
          TIMEOUTS.UPDATE,
          'Failed to update company. The request timed out. Please try again.'
        )

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:177',message:'Company update result',data:{hasError:!!companyError,errorCode:companyError?.code,errorMessage:companyError?.message,errorDetails:companyError?.details,errorHint:companyError?.hint,hasData:!!updateData,dataLength:updateData?.length,updatedId:updateData?.[0]?.id,updatedName:updateData?.[0]?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
        // #endregion

        if (companyError) {
          console.error('Company update error:', {
            message: companyError.message,
            code: companyError.code,
            details: companyError.details,
            hint: companyError.hint,
            status: companyError.status,
          })
          
          // Provide more specific error messages
          let errorMessage = 'Failed to update company. Please try again.'
          if (companyError.code === '23505') {
            errorMessage = 'You already own a company. Each user can only have one company.'
          } else if (companyError.message) {
            errorMessage = companyError.message
          }
          
          return {
            error: errorMessage,
          }
        }
        
        if (!updateData || updateData.length === 0) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:195',message:'No data returned from update',data:{companyId,hasData:!!updateData,dataLength:updateData?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          return {
            error: 'Company update completed but no data was returned. The company may not exist.',
          }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:202',message:'Company update success',data:{companyId,updatedName:updateData[0]?.name,updatedEmail:updateData[0]?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'SUCCESS'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/89bc02dc-6d86-4a10-b990-b9a557f9da17',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'profile-data-actions.ts:256',message:'No companyId found',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        return {
          error: 'Failed to create or find company. Please try again.',
        }
      }
    
    // Note: Profile update errors are logged but don't fail the request
    // since company update is the primary operation

    // Revalidate the profile page to show updated data
    revalidatePath('/profile')

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  } catch (error: unknown) {
    // Handle timeout errors
    if (error instanceof TimeoutError) {
      return {
        error: error.message || 'Request timed out. Please try again.',
      }
    }
    
    // Log the actual error for debugging
    console.error('Unexpected error in updateProfileAction:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Return a more helpful error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred. Please try again.'
    
    return {
      error: errorMessage.includes('already owns') 
        ? 'You already own a company. Each user can only have one company.'
        : errorMessage,
    }
  }
}


