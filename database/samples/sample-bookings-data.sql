-- ============================================================================
-- SAMPLE BOOKINGS DATA
-- ============================================================================
-- This script creates sample booking data for testing
-- IMPORTANT: Run this AFTER you have:
-- 1. Created companies
-- 2. Created customers
-- 3. Created cars
-- 4. Created locations
-- ============================================================================

-- First, let's get some existing data to reference
DO $$
DECLARE
  v_company_id UUID;
  v_car_id UUID;
  v_customer_id UUID;
  v_pickup_location_id UUID;
  v_dropoff_location_id UUID;
  v_booking_count INTEGER;
BEGIN
  -- Get the first company
  SELECT id INTO v_company_id
  FROM public.companies
  LIMIT 1;
  
  -- Get the first car for this company
  SELECT id INTO v_car_id
  FROM public.cars
  WHERE company_id = v_company_id
  LIMIT 1;
  
  -- Get the first customer
  SELECT id INTO v_customer_id
  FROM public.customers
  LIMIT 1;
  
  -- Get pickup and dropoff locations for this company
  SELECT id INTO v_pickup_location_id
  FROM public.locations
  WHERE company_id = v_company_id
    AND is_pickup = true
    AND is_active = true
  LIMIT 1;
  
  SELECT id INTO v_dropoff_location_id
  FROM public.locations
  WHERE company_id = v_company_id
    AND is_dropoff = true
    AND is_active = true
  LIMIT 1;
  
  -- Check if we have all required data
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company found. Please create a company first.';
  END IF;
  
  IF v_car_id IS NULL THEN
    RAISE EXCEPTION 'No car found for company. Please create a car first.';
  END IF;
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'No customer found. Please create a customer first.';
  END IF;
  
  IF v_pickup_location_id IS NULL THEN
    RAISE EXCEPTION 'No pickup location found for company. Please create a location with is_pickup=true first.';
  END IF;
  
  IF v_dropoff_location_id IS NULL THEN
    RAISE EXCEPTION 'No dropoff location found for company. Please create a location with is_dropoff=true first.';
  END IF;
  
  -- Check how many bookings already exist
  SELECT COUNT(*) INTO v_booking_count
  FROM public.bookings
  WHERE company_id = v_company_id;
  
  -- Only insert if we don't have many bookings already
  IF v_booking_count < 5 THEN
    -- Insert sample bookings with different statuses and dates
    INSERT INTO public.bookings (
      company_id,
      customer_id,
      car_id,
      pickup_location_id,
      dropoff_location_id,
      start_ts,
      end_ts,
      total_price,
      status,
      notes
    ) VALUES
    -- Past booking (returned)
    (
      v_company_id,
      v_customer_id,
      v_car_id,
      v_pickup_location_id,
      v_dropoff_location_id,
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '5 days',
      150.00,
      'returned',
      'Sample past booking - completed successfully'
    ),
    -- Current booking (confirmed)
    (
      v_company_id,
      v_customer_id,
      v_car_id,
      v_pickup_location_id,
      v_dropoff_location_id,
      NOW() + INTERVAL '2 days',
      NOW() + INTERVAL '5 days',
      300.00,
      'confirmed',
      'Sample confirmed booking - upcoming rental'
    ),
    -- Active booking (picked_up)
    (
      v_company_id,
      v_customer_id,
      v_car_id,
      v_pickup_location_id,
      v_dropoff_location_id,
      NOW() - INTERVAL '1 day',
      NOW() + INTERVAL '3 days',
      200.00,
      'picked_up',
      'Sample active booking - car is currently rented'
    ),
    -- Future booking (pending)
    (
      v_company_id,
      v_customer_id,
      v_car_id,
      v_pickup_location_id,
      v_dropoff_location_id,
      NOW() + INTERVAL '10 days',
      NOW() + INTERVAL '15 days',
      400.00,
      'pending',
      'Sample pending booking - awaiting confirmation'
    ),
    -- Cancelled booking
    (
      v_company_id,
      v_customer_id,
      v_car_id,
      v_pickup_location_id,
      v_dropoff_location_id,
      NOW() + INTERVAL '20 days',
      NOW() + INTERVAL '25 days',
      500.00,
      'cancelled',
      'Sample cancelled booking - customer cancelled'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted 5 sample bookings for company %', v_company_id;
  ELSE
    RAISE NOTICE 'Company already has % bookings. Skipping sample data insertion.', v_booking_count;
  END IF;
END $$;

-- Verify the bookings were created
SELECT 
  'Bookings Created' as status,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'picked_up') as picked_up,
  COUNT(*) FILTER (WHERE status = 'returned') as returned,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM public.bookings;

