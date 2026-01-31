-- ============================================================================
-- CARS & LOCATIONS RLS: Allow customers to read cars/locations for their bookings
-- ============================================================================
-- Enrichment requires reading cars and locations by id. Customers must be able
-- to SELECT only those cars (and locations) that are referenced by their own
-- bookings (resolved via customer_id).
--
-- Prerequisites: bookings.customer_id, customers.user_id, bookings.car_id.
-- For locations: bookings.pickup_location_id, bookings.dropoff_location_id,
-- and public.locations table must exist.
--
-- Run after bookings-rls-customer-by-id.sql. Run in Supabase SQL Editor.
-- ============================================================================

-- Cars: allow SELECT for cars that appear in the customer's bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cars') THEN
    RAISE NOTICE 'Skipped: public.cars does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    RAISE NOTICE 'Skipped: public.customers does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_id') THEN
    RAISE NOTICE 'Skipped: public.bookings.customer_id does not exist.';
  ELSE
    DROP POLICY IF EXISTS "Customers can view cars in own bookings" ON public.cars;
    CREATE POLICY "Customers can view cars in own bookings"
      ON public.cars
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND id IN (
          SELECT b.car_id FROM public.bookings b
          INNER JOIN public.customers c ON c.id = b.customer_id AND c.user_id = auth.uid()
          WHERE b.car_id IS NOT NULL
        )
      );
    RAISE NOTICE 'Applied RLS policy: Customers can view cars in own bookings.';
  END IF;
END $$;

-- Locations: allow SELECT for locations that appear in the customer's bookings (if table exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    RAISE NOTICE 'Skipped: public.locations does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    RAISE NOTICE 'Skipped: public.customers does not exist.';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'pickup_location_id') THEN
    RAISE NOTICE 'Skipped: public.bookings.pickup_location_id does not exist.';
  ELSE
    ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Customers can view locations in own bookings" ON public.locations;
    CREATE POLICY "Customers can view locations in own bookings"
      ON public.locations
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL
        AND (
          id IN (
            SELECT b.pickup_location_id FROM public.bookings b
            INNER JOIN public.customers c ON c.id = b.customer_id AND c.user_id = auth.uid()
            WHERE b.pickup_location_id IS NOT NULL
          )
          OR id IN (
            SELECT b.dropoff_location_id FROM public.bookings b
            INNER JOIN public.customers c ON c.id = b.customer_id AND c.user_id = auth.uid()
            WHERE b.dropoff_location_id IS NOT NULL
          )
        )
      );
    RAISE NOTICE 'Applied RLS policy: Customers can view locations in own bookings.';
  END IF;
END $$;
