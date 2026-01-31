-- ============================================================================
-- BOOKINGS RLS: Allow partners to see bookings for their company
-- ============================================================================
-- If your bookings table has company_id and companies has owner_id, this
-- policy lets the company owner (partner) SELECT bookings for their company.
-- Run after add-owner-id-to-companies.sql if you use company-based bookings.
--
-- Prerequisites (checked at run time):
-- - public.bookings has company_id
-- - public.companies has owner_id
--
-- Run in Supabase SQL Editor.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'company_id') THEN
    RAISE NOTICE 'Skipped: public.bookings.company_id does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'owner_id') THEN
    RAISE NOTICE 'Skipped: public.companies.owner_id does not exist. Run add-owner-id-to-companies.sql first.';
  ELSE
    DROP POLICY IF EXISTS "Partners can view company bookings" ON public.bookings;
    CREATE POLICY "Partners can view company bookings"
      ON public.bookings
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND company_id IN (
          SELECT c.id FROM public.companies c
          WHERE c.owner_id = auth.uid()
        )
      );
    RAISE NOTICE 'Applied RLS policy: Partners can view company bookings.';
  END IF;
END $$;
