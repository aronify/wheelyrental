-- ============================================================================
-- BOOKINGS RLS: Allow customers to see their own bookings by customer_id
-- ============================================================================
-- Access strategy: Never query bookings by auth.uid(); resolve customer_id from
-- public.customers (customers.user_id = auth.uid(), customers.id = customer_id).
-- This policy lets the authenticated customer SELECT bookings where
-- customer_id matches their customers.id.
--
-- Prerequisites:
-- - public.bookings has customer_id
-- - public.customers has user_id (link to auth.users.id) and id (customer_id)
--
-- Run in Supabase SQL Editor.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_id') THEN
    RAISE NOTICE 'Skipped: public.bookings.customer_id does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'user_id') THEN
    RAISE NOTICE 'Skipped: public.customers.user_id does not exist.';
  ELSE
    DROP POLICY IF EXISTS "Customers can view own bookings by customer_id" ON public.bookings;
    CREATE POLICY "Customers can view own bookings by customer_id"
      ON public.bookings
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND customer_id IN (
          SELECT id FROM public.customers
          WHERE user_id = auth.uid()
        )
      );
    RAISE NOTICE 'Applied RLS policy: Customers can view own bookings by customer_id.';
  END IF;
END $$;
