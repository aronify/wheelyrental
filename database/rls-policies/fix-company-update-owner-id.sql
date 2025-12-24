-- ============================================================================
-- Fix: Ensure existing companies have owner_id set
-- This script updates companies that don't have owner_id set
-- ============================================================================

-- For companies without owner_id, try to infer from cars table
-- If a company has cars, and we can find a user who created those cars,
-- we can set the owner_id (this is a one-time migration)

-- Note: This is a best-effort migration
-- Companies without owner_id and without cars will need manual assignment

UPDATE public.companies c
SET owner_id = (
  SELECT DISTINCT cm.user_id
  FROM public.company_members cm
  WHERE cm.company_id = c.id
  AND cm.is_active = true
  LIMIT 1
)
WHERE c.owner_id IS NULL
AND EXISTS (
  SELECT 1 FROM public.company_members cm
  WHERE cm.company_id = c.id
  AND cm.is_active = true
);

-- If company_members doesn't exist, skip that part
-- The application code will set owner_id when updating

