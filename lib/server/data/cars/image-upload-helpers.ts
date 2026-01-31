'use server'

import { createServerActionClient } from '@/lib/supabase/client'
import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout'

/**
 * Upload multiple car images to Supabase Storage
 * @param imageFiles - Array of File objects to upload
 * @param carId - Optional car ID for organizing images
 * @returns Array of public URLs or error
 */
export async function uploadCarImages(
  imageFiles: File[],
  carId?: string
): Promise<{ urls?: string[]; error?: string }> {
  const uploadedUrls: string[] = []
  const errors: string[] = []

  // Upload images one by one with a small delay to prevent rate limiting
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i]
    try {
      const result = await uploadCarImage(imageFile, carId)
      if (result.error) {
        errors.push(`Image ${i + 1}: ${result.error}`)
        console.warn(`[uploadCarImages] Image ${i + 1} failed:`, result.error)
      } else if (result.url) {
        uploadedUrls.push(result.url)
      }
      
      // Small delay between uploads to prevent rate limiting (except for last image)
      if (i < imageFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Image ${i + 1}: ${errorMsg}`)
      console.error(`[uploadCarImages] Error uploading image ${i + 1}:`, error)
      // Continue with next image
    }
  }

  if (errors.length > 0 && uploadedUrls.length === 0) {
    // All uploads failed
    return { error: `Failed to upload all images: ${errors[0]}` }
  }

  if (errors.length > 0 && uploadedUrls.length > 0) {
    // Some succeeded, some failed - return success but log warnings
    console.warn('[uploadCarImages] Some images failed to upload:', errors)
    // Don't return error - partial success is acceptable
  }

  if (uploadedUrls.length === 0) {
    return { error: 'No images were uploaded successfully' }
  }

  return { urls: uploadedUrls }
}

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
