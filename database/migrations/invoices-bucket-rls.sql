-- ============================================================================
-- INVOICES BUCKET: STORAGE RLS
-- ============================================================================
-- Secure RLS for the storage bucket 'invoices'. Invoice files are stored
-- under user_id/filename (e.g. user_id/invoice.pdf). Authenticated users can:
-- - INSERT into the bucket (upload); path must be under their user_id folder
-- - SELECT (read) only objects under their user_id folder
-- - DELETE only objects under their user_id folder
--
-- Prerequisites: Create the bucket 'invoices' in Supabase Dashboard (Storage)
-- if it does not exist. This script only defines policies on storage.objects.
-- ============================================================================

-- Drop existing policies so this script is idempotent
DROP POLICY IF EXISTS "Authenticated users can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own invoices" ON storage.objects;

-- Upload: authenticated users can INSERT into bucket 'invoices'; path must start with auth.uid()
CREATE POLICY "Authenticated users can upload invoices"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: users can SELECT only objects in their own folder (first path segment = auth.uid())
CREATE POLICY "Users can view their own invoices"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: users can UPDATE only their own objects (e.g. replace file)
CREATE POLICY "Users can update their own invoices"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: users can DELETE only their own objects
CREATE POLICY "Users can delete their own invoices"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
