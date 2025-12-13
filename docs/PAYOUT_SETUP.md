# Payout Requests Setup

## Database Setup

1. Run the updated `supabase-schema.sql` file in your Supabase SQL Editor to create the `payout_requests` table.

## Storage Bucket Setup

1. Go to your Supabase Dashboard → Storage
2. Create a new bucket named `invoices`
3. Set the bucket to **Private** (users can only access their own files)
4. Run the updated `supabase-storage.sql` file in your Supabase SQL Editor to set up the storage policies

## Storage Bucket Configuration

The `invoices` bucket should be configured with:
- **Name**: `invoices`
- **Public**: No (Private)
- **File size limit**: 10MB
- **Allowed MIME types**: application/pdf, image/jpeg, image/png

## Features

- Users can upload invoices (PDF, JPG, PNG)
- Optional amount and description fields
- Files are stored in Supabase Storage under `invoices/{user_id}/{timestamp}-{random}.{ext}`
- Payout requests are saved with status 'pending'
- Row Level Security ensures users can only see their own requests

