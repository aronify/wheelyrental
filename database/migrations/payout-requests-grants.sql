-- ============================================================================
-- PAYOUT_REQUESTS: GRANT PERMISSIONS
-- ============================================================================
-- The authenticated role must have table-level privileges. RLS policies
-- then restrict which rows are visible/insertable. Without these GRANTs
-- you get "permission denied for table payout_requests".
-- ============================================================================

GRANT SELECT, INSERT ON public.payout_requests TO authenticated;

-- Optional: if anon ever needs to read (e.g. public status page), grant SELECT only
-- and rely on RLS; typically not needed for partner dashboard.
-- GRANT SELECT ON public.payout_requests TO anon;
