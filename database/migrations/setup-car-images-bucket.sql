-- ============================================================================
-- Setup: car-images Storage Bucket
-- ============================================================================
-- 
-- This script creates the car-images storage bucket if it doesn't exist.
-- Run this BEFORE running supabase-storage.sql
--
-- Steps:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket manually OR run this script
-- 3. Then run supabase-storage.sql to set up policies
--
-- ============================================================================

-- Note: Storage buckets must be created via the Supabase Dashboard or API
-- This script is for reference only - you need to create the bucket manually

-- To create via Supabase Dashboard:
-- 1. Go to Storage in your Supabase project
-- 2. Click "New bucket"
-- 3. Name: car-images
-- 4. Public bucket: YES (checked)
-- 5. File size limit: 10MB (or your preference)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp (optional)
-- 7. Click "Create bucket"

-- After creating the bucket, run supabase-storage.sql to set up RLS policies

-- ============================================================================
-- Verification Query
-- ============================================================================
-- After creating the bucket, verify it exists:
-- 
-- SELECT name, id, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE name = 'car-images';
--
-- Expected result: One row with name='car-images', public=true
--
-- ============================================================================
