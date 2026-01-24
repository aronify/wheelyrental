'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout'

/**
 * Upload car image to Supabase Storage
 * @param imageFile - File object to upload
 * @param carId - Optional car ID for organizing images
 * @returns Public URL of the uploaded image or error
 */
export async function uploadCarImage(
  imageFile: File,
  carId?: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createServerActionClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await withTimeout(
      supabase.auth.getUser(),
      TIMEOUTS.AUTH_CHECK,
      'Authentication check timed out'
    )

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return { error: 'Invalid file type. Please upload an image file.' }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      return { error: 'File is too large. Maximum size is 10MB.' }
    }

    // Generate unique filename
    const fileExt = imageFile.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileName = carId 
      ? `${carId}/${timestamp}-${randomStr}.${fileExt}`
      : `temp/${user.id}/${timestamp}-${randomStr}.${fileExt}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await imageFile.arrayBuffer()

    // Upload to car-images bucket
    const { data: uploadData, error: uploadError } = await withTimeout(
      supabase.storage
        .from('car-images')
        .upload(fileName, arrayBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        }),
      TIMEOUTS.UPLOAD,
      'Image upload timed out'
    )

    if (uploadError) {
      console.error('[uploadCarImage] Upload error:', uploadError)
      return { error: `Failed to upload image: ${uploadError.message}` }
    }

    if (!uploadData?.path) {
      return { error: 'Upload succeeded but no path returned' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('car-images')
      .getPublicUrl(uploadData.path)

    if (!urlData?.publicUrl) {
      // If public URL fails, try to delete the uploaded file
      await supabase.storage
        .from('car-images')
        .remove([uploadData.path])
      
      return { error: 'Failed to get public URL for uploaded image' }
    }

    return { url: urlData.publicUrl }
  } catch (error: unknown) {
    console.error('[uploadCarImage] Unexpected error:', error)
    return { 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Delete car image from Supabase Storage
 * @param imageUrl - Public URL of the image to delete
 * @returns Success or error
 */
export async function deleteCarImage(
  imageUrl: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerActionClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await withTimeout(
      supabase.auth.getUser(),
      TIMEOUTS.AUTH_CHECK,
      'Authentication check timed out'
    )

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/car-images/[path]
    const urlParts = imageUrl.split('/car-images/')
    if (urlParts.length !== 2) {
      return { error: 'Invalid image URL format' }
    }

    const filePath = urlParts[1]

    // Delete from storage
    const { error: deleteError } = await withTimeout(
      supabase.storage
        .from('car-images')
        .remove([filePath]),
      TIMEOUTS.DELETE,
      'Image deletion timed out'
    )

    if (deleteError) {
      console.error('[deleteCarImage] Delete error:', deleteError)
      // Don't fail if file doesn't exist (might have been deleted already)
      if (deleteError.message?.includes('not found')) {
        return { success: true }
      }
      return { error: `Failed to delete image: ${deleteError.message}` }
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('[deleteCarImage] Unexpected error:', error)
    return { 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}
