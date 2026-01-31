-- Dummy reviews data for testing
-- Prerequisites: bookings must exist for the given booking_ids and car_id 826f2dbe-3732-4de6-9654-07445da02309.
-- customer_id and booking_reference are taken from each booking; company_id from the car.

INSERT INTO public.reviews (
  id,
  booking_id,
  booking_reference,
  customer_id,
  car_id,
  company_id,
  rating,
  title,
  comment,
  is_visible,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  b.id,
  b.booking_reference,
  b.customer_id,
  b.car_id,
  c.company_id,
  v.rating,
  v.title,
  v.comment,
  true,
  now(),
  now()
FROM (
  VALUES
    ('3cbe6375-c8f1-424d-a4be-2a7c965a3e41'::uuid, 5, 'Smooth rental', 'Car was clean and pickup was on time. Would rent again.'),
    ('4554bacb-49e0-40a7-bbe3-34a66be8dabf'::uuid, 4, 'Good experience', 'No issues. Car matched the listing.'),
    ('5fb0c194-3278-4fa7-8296-a537ffa20279'::uuid, 5, 'Excellent', 'Very professional. Highly recommend.')
) AS v(booking_id, rating, title, comment)
JOIN public.bookings b ON b.id = v.booking_id
JOIN public.cars c ON c.id = b.car_id
WHERE b.car_id = '826f2dbe-3732-4de6-9654-07445da02309'::uuid
ON CONFLICT (booking_id) DO NOTHING;
