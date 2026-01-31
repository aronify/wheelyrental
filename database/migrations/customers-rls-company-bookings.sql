-- ============================================================================
-- CUSTOMERS RLS: Allow partners to read customers from their company bookings
-- ============================================================================
-- Partners see bookings for their company (via companies.owner_id). Customer
-- rows are often created by the platform with a different user_id, so the
-- default "user_id = auth.uid()" policy blocks partners from seeing those
-- customers. This adds a policy so partners can SELECT customers that appear
-- in bookings of companies they own.
--
-- Prerequisites (checked at run time):
-- - public.customers table exists
-- - public.bookings has company_id
-- - public.companies has owner_id
--
-- If public.customers does not exist, this script does nothing (no error).
-- Run in Supabase SQL Editor.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    RAISE NOTICE 'Skipped: public.customers table does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'owner_id') THEN
    RAISE NOTICE 'Skipped: public.companies.owner_id does not exist. Run add-owner-id-to-companies.sql first.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'company_id') THEN
    RAISE NOTICE 'Skipped: public.bookings.company_id does not exist.';
  ELSE
    DROP POLICY IF EXISTS "Partners can view customers from company bookings" ON public.customers;
    CREATE POLICY "Partners can view customers from company bookings"
      ON public.customers
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND id IN (
          SELECT b.customer_id
          FROM public.bookings b
          INNER JOIN public.companies c ON c.id = b.company_id
          WHERE c.owner_id = auth.uid()
            AND b.customer_id IS NOT NULL
        )
      );
    RAISE NOTICE 'Applied RLS policy on public.customers for company bookings.';
  END IF;
END $$;
