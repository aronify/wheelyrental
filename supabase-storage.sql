-- Storage Policies for Wheely Owner Portal
-- Run this AFTER creating the storage buckets

-- Policy: Allow authenticated users to upload car images
CREATE POLICY "Authenticated users can upload car images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-images');

-- Policy: Allow public to view car images
CREATE POLICY "Public can view car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- Policy: Allow owners to delete their own car images
CREATE POLICY "Owners can delete their car images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images');

-- Policy: Allow authenticated users to upload profile logos
CREATE POLICY "Authenticated users can upload profile logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-logos');

-- Policy: Allow public to view profile logos
CREATE POLICY "Public can view profile logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-logos');

-- Policy: Allow owners to delete their own profile logos
CREATE POLICY "Owners can delete their profile logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-logos');
