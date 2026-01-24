'use server'

import { uploadCarImage } from './image-upload-helpers'

/**
 * Server action to upload a car image
 * Accepts FormData with an 'image' file field
 */
export async function uploadCarImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  const imageFile = formData.get('image') as File | null
  
  if (!imageFile || !(imageFile instanceof File)) {
    return { error: 'No image file provided' }
  }

  const carId = formData.get('carId') as string | null
  
  return await uploadCarImage(imageFile, carId || undefined)
}
