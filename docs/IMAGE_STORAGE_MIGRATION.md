# Car Image Storage Migration

## Overview

Car images are now stored in Supabase Storage (`car-images` bucket) instead of as base64 strings in the database.

## Implementation

### Storage Location
- **Bucket**: `car-images`
- **Path Format**: `{carId}/{timestamp}-{random}.{ext}` or `temp/{userId}/{timestamp}-{random}.{ext}` for new cars
- **Public Access**: Yes (images are publicly viewable via CDN)

### Upload Process

1. **Frontend**: User selects image file
2. **Frontend**: Image is compressed/resized (max 1200x800px, 0.7 JPEG quality)
3. **Frontend**: Image is converted to base64 for preview
4. **Frontend**: Base64 string is sent to server action
5. **Backend**: Server converts base64 to File object
6. **Backend**: File is uploaded to Supabase Storage
7. **Backend**: Public URL is saved to `cars.image_url` column

### Code Changes

#### New Files
- `lib/server/data/image-upload-helpers.ts` - Helper functions for uploading/deleting images
- `lib/server/data/image-upload-actions.ts` - Server action for direct image uploads

#### Modified Files
- `lib/server/data/cars-data-actions.ts` - Updated to upload images to storage
- `app/components/domain/cars/car-form-modal.tsx` - Sends image data
- `app/components/domain/cars/car-edit-form.tsx` - Sends image data
- `types/car.ts` - Added `imageFile` field to `CarFormData`

### Storage Policies

The `car-images` bucket has the following RLS policies (from `supabase-storage.sql`):

1. **Upload**: Authenticated users can upload images
2. **View**: Public can view images (for CDN access)
3. **Delete**: Authenticated users can delete images

### Migration Notes

- **Backward Compatibility**: The system still accepts base64 images and converts them to storage URLs
- **Existing Images**: Base64 images in the database will be migrated to storage on next update
- **Old Images**: When updating a car with a new image, old storage images are automatically deleted

### Benefits

1. **Performance**: Images served via CDN instead of database
2. **Database Size**: Reduced database size (no base64 blobs)
3. **Scalability**: Better handling of large images
4. **Cost**: More efficient storage and bandwidth usage

### Setup Requirements

1. **Create Storage Bucket**: 
   - Go to Supabase Dashboard → Storage
   - Create bucket named `car-images`
   - Set to public

2. **Run Storage Policies**:
   - Run `database/migrations/supabase-storage.sql` in Supabase SQL Editor

3. **Verify**:
   - Test uploading a car image
   - Check that image URL is a Supabase Storage URL
   - Verify image is accessible publicly

### Troubleshooting

**Issue**: "Failed to upload image: permission denied"
- **Solution**: Ensure storage bucket exists and policies are set up correctly

**Issue**: Images not displaying
- **Solution**: Check that bucket is set to public and policies allow SELECT

**Issue**: Old base64 images still in database
- **Solution**: They will be migrated automatically on next car update, or manually update the car
