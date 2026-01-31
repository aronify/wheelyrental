-- ============================================================================
-- SAMPLE BOOKINGS & BALANCE FOR COMPANY
-- ============================================================================
-- Inserts multiple bookings for a specific car, company, customer, and
-- location. Optionally seeds user_balance for company members so the
-- dashboard shows available balance.
--
-- Prerequisites:
-- - Bookings table has: company_id, car_id, customer_id, pickup_location_id,
--   dropoff_location_id, start_ts, end_ts, total_price, status, notes
--   (If your schema uses start_date_time/end_date_time or pickup_location TEXT,
--   adjust column names in the INSERT below.)
-- - Car, company, customer, and location IDs exist.
-- - user_balance table exists (from user-balance-and-payout-control.sql) if
--   you run the balance seed section.
--
-- Run in Supabase SQL Editor.
-- ============================================================================

DO $$
DECLARE
  v_car_id          UUID := '826f2dbe-3732-4de6-9654-07445da02309';
  v_company_id      UUID := 'b4e4aae4-0ae2-4f90-834a-ce7e9efeef08';
  v_pickup_loc_id   UUID := 'a1cad429-e584-4fac-9485-8f028ee7ca2d';
  v_dropoff_loc_id  UUID := 'a1cad429-e584-4fac-9485-8f028ee7ca2d';
  v_customer_id     UUID := '5b40b161-119f-45a9-bee5-a541d96ee1fe';
  v_start           TIMESTAMPTZ;
  v_end             TIMESTAMPTZ;
  v_total           NUMERIC(10,2);
  v_status          TEXT;
  v_notes           TEXT;
BEGIN
  -- Insert multiple bookings with varied dates, amounts, and statuses
  -- Booking 1: Past (returned) – 7 days ago
  v_start := NOW() - INTERVAL '7 days';
  v_end   := NOW() - INTERVAL '5 days';
  v_total := 120.00;
  v_status := 'returned';
  v_notes := 'Sample booking – completed';
  INSERT INTO public.bookings (
    company_id,
    car_id,
    customer_id,
    pickup_location_id,
    dropoff_location_id,
    start_ts,
    end_ts,
    total_price,
    status,
    notes
  ) VALUES (
    v_company_id,
    v_car_id,
    v_customer_id,
    v_pickup_loc_id,
    v_dropoff_loc_id,
    v_start,
    v_end,
    v_total,
    v_status,
    v_notes
  );

  -- Booking 2: Past (returned) – 14 days ago
  v_start := NOW() - INTERVAL '14 days';
  v_end   := NOW() - INTERVAL '11 days';
  v_total := 240.00;
  v_status := 'returned';
  v_notes := 'Sample booking – 3-day rental';
  INSERT INTO public.bookings (
    company_id,
    car_id,
    customer_id,
    pickup_location_id,
    dropoff_location_id,
    start_ts,
    end_ts,
    total_price,
    status,
    notes
  ) VALUES (
    v_company_id,
    v_car_id,
    v_customer_id,
    v_pickup_loc_id,
    v_dropoff_loc_id,
    v_start,
    v_end,
    v_total,
    v_status,
    v_notes
  );

  -- Booking 3: Current (picked_up)
  v_start := NOW() - INTERVAL '1 day';
  v_end   := NOW() + INTERVAL '2 days';
  v_total := 180.00;
  v_status := 'picked_up';
  v_notes := 'Sample booking – active rental';
  INSERT INTO public.bookings (
    company_id,
    car_id,
    customer_id,
    pickup_location_id,
    dropoff_location_id,
    start_ts,
    end_ts,
    total_price,
    status,
    notes
  ) VALUES (
    v_company_id,
    v_car_id,
    v_customer_id,
    v_pickup_loc_id,
    v_dropoff_loc_id,
    v_start,
    v_end,
    v_total,
    v_status,
    v_notes
  );

  -- Booking 4: Upcoming (confirmed)
  v_start := NOW() + INTERVAL '5 days';
  v_end   := NOW() + INTERVAL '8 days';
  v_total := 270.00;
  v_status := 'confirmed';
  v_notes := 'Sample booking – confirmed';
  INSERT INTO public.bookings (
    company_id,
    car_id,
    customer_id,
    pickup_location_id,
    dropoff_location_id,
    start_ts,
    end_ts,
    total_price,
    status,
    notes
  ) VALUES (
    v_company_id,
    v_car_id,
    v_customer_id,
    v_pickup_loc_id,
    v_dropoff_loc_id,
    v_start,
    v_end,
    v_total,
    v_status,
    v_notes
  );

  -- Booking 5: Future (pending)
  v_start := NOW() + INTERVAL '12 days';
  v_end   := NOW() + INTERVAL '15 days';
  v_total := 150.00;
  v_status := 'pending';
  v_notes := 'Sample booking – pending confirmation';
  INSERT INTO public.bookings (
    company_id,
    car_id,
    customer_id,
    pickup_location_id,
    dropoff_location_id,
    start_ts,
    end_ts,
    total_price,
    status,
    notes
  ) VALUES (
    v_company_id,
    v_car_id,
    v_customer_id,
    v_pickup_loc_id,
    v_dropoff_loc_id,
    v_start,
    v_end,
    v_total,
    v_status,
    v_notes
  );

  -- Booking 6: Future (confirmed)
  v_start := NOW() + INTERVAL '20 days';
  v_end   := NOW() + INTERVAL '25 days';
  v_total := 400.00;
  v_status := 'confirmed';
  v_notes := 'Sample booking – next month';
  INSERT INTO public.bookings (
    company_id,
    car_id,
    customer_id,
    pickup_location_id,
    dropoff_location_id,
    start_ts,
    end_ts,
    total_price,
    status,
    notes
  ) VALUES (
    v_company_id,
    v_car_id,
    v_customer_id,
    v_pickup_loc_id,
    v_dropoff_loc_id,
    v_start,
    v_end,
    v_total,
    v_status,
    v_notes
  );

  RAISE NOTICE 'Inserted 6 sample bookings for car %, company %', v_car_id, v_company_id;
END $$;

-- ============================================================================
-- OPTIONAL: Seed user_balance for company members (simulate “balance from bookings”)
-- ============================================================================
-- Credits each company member with a fixed available_balance so the dashboard
-- and payout flow show non-zero balance. Adjust amount as needed.
DO $$
DECLARE
  v_company_id UUID := 'b4e4aae4-0ae2-4f90-834a-ce7e9efeef08';
  v_credit    NUMERIC(12,2) := 800.00;  -- Simulated balance per user
  r           RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_balance'
  ) THEN
    RAISE NOTICE 'user_balance table not found. Skip balance seed or run user-balance-and-payout-control.sql first.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_members'
  ) THEN
    RAISE NOTICE 'company_members table not found. Skipping balance seed.';
    RETURN;
  END IF;

  FOR r IN
    SELECT cm.user_id
    FROM public.company_members cm
    WHERE cm.company_id = v_company_id
      AND cm.is_active = true
  LOOP
    INSERT INTO public.user_balance (user_id, available_balance, pending_payout_amount)
    VALUES (r.user_id, v_credit, 0)
    ON CONFLICT (user_id) DO UPDATE SET
      available_balance = public.user_balance.available_balance + v_credit,
      last_updated_at = NOW();
  END LOOP;

  RAISE NOTICE 'Credited user_balance for company members (company %)', v_company_id;
END $$;

-- Verify bookings (run after the script)
-- SELECT id, company_id, car_id, customer_id, start_ts, end_ts, total_price, status
-- FROM public.bookings
-- WHERE company_id = 'b4e4aae4-0ae2-4f90-834a-ce7e9efeef08'
-- ORDER BY start_ts DESC;
