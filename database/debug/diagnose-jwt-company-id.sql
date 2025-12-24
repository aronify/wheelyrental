-- ============================================================================
-- DIAGNOSE JWT COMPANY_ID CLAIM
-- ============================================================================
-- This script checks if auth.jwt() contains company_id
-- Run this while authenticated to see your JWT claims
-- ============================================================================

-- Check current JWT claims (run as authenticated user)
SELECT 
  'JWT Claims Check' as diagnostic_step,
  auth.jwt() as full_jwt,
  auth.jwt() ->> 'company_id' as company_id_from_jwt,
  auth.jwt() ->> 'sub' as user_id_from_jwt,
  auth.uid() as current_user_id;

-- Check if company_id exists in JWT
SELECT 
  'JWT Company ID Check' as diagnostic_step,
  CASE 
    WHEN auth.jwt() ->> 'company_id' IS NULL THEN '❌ company_id is MISSING in JWT'
    ELSE '✅ company_id exists: ' || (auth.jwt() ->> 'company_id')
  END as jwt_status,
  auth.jwt() ->> 'company_id' as company_id_value;

-- Check app_metadata for all users
SELECT 
  'App Metadata Check' as diagnostic_step,
  id as user_id,
  email,
  raw_app_meta_data->>'company_id' as company_id_in_metadata,
  raw_app_meta_data as full_metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check companies table for owner_id mapping
SELECT 
  'Company Ownership Check' as diagnostic_step,
  c.id as company_id,
  c.name as company_name,
  c.owner_id as user_id,
  u.email as user_email,
  u.raw_app_meta_data->>'company_id' as metadata_company_id
FROM public.companies c
LEFT JOIN auth.users u ON u.id = c.owner_id
ORDER BY c.created_at DESC
LIMIT 10;

