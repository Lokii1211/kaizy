-- ════════════════════════════════════════════════════════
-- 007_get_nearby_workers.sql — Nearby Workers Distance RPC
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_nearby_workers(
  user_lat DECIMAL,
  user_lng DECIMAL,
  trade_filter TEXT DEFAULT NULL,
  radius_km INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  profile_photo TEXT,
  trade_primary TEXT,
  avg_rating DECIMAL,
  total_jobs INTEGER,
  verification_lvl INTEGER,
  is_online BOOLEAN,
  upi_id TEXT,
  starting_price DECIMAL,
  cheapest_service TEXT,
  distance_km DECIMAL,
  eta_minutes INTEGER,
  latitude DECIMAL,
  longitude DECIMAL
) AS $$
SELECT
  wp.id,
  COALESCE(u.name, 'Kaizy Captain') as name,
  u.profile_photo,
  COALESCE(wp.trade_primary, wp.trade, 'electrician') as trade_primary,
  COALESCE(wp.avg_rating, wp.rating, 4.8) as avg_rating,
  COALESCE(wp.total_jobs, wp.jobs_completed, 0) as total_jobs,
  COALESCE(wp.verification_lvl, 1) as verification_lvl,
  wp.is_online,
  wp.upi_id,
  COALESCE(
    (SELECT MIN(price_min) FROM worker_pricing WHERE worker_id = wp.id
     AND (trade_filter IS NULL OR trade_filter = '' OR trade = trade_filter)),
    wp.rate_hourly,
    199
  ) as starting_price,
  COALESCE(
    (SELECT mp.display_name FROM market_pricing mp
     JOIN worker_pricing wpr ON mp.problem_type = wpr.problem_type
     WHERE wpr.worker_id = wp.id
     AND (trade_filter IS NULL OR trade_filter = '' OR wpr.trade = trade_filter)
     ORDER BY wpr.price_min LIMIT 1),
    'General inspection'
  ) as cheapest_service,
  ROUND((6371 * acos(LEAST(1.0, cos(radians(user_lat))
    * cos(radians(wp.latitude))
    * cos(radians(wp.longitude) - radians(user_lng))
    + sin(radians(user_lat)) * sin(radians(wp.latitude))
  )))::numeric, 1) as distance_km,
  CEIL((6371 * acos(LEAST(1.0, cos(radians(user_lat))
    * cos(radians(wp.latitude))
    * cos(radians(wp.longitude) - radians(user_lng))
    + sin(radians(user_lat)) * sin(radians(wp.latitude))
  )) / 0.5)::integer as eta_minutes,
  wp.latitude,
  wp.longitude
FROM worker_profiles wp
JOIN users u ON wp.id = u.id
WHERE wp.is_online = TRUE
AND wp.latitude IS NOT NULL
AND wp.longitude IS NOT NULL
AND (6371 * acos(LEAST(1.0, cos(radians(user_lat))
    * cos(radians(wp.latitude))
    * cos(radians(wp.longitude) - radians(user_lng))
    + sin(radians(user_lat)) * sin(radians(wp.latitude))
  )) <= radius_km)
AND (trade_filter IS NULL OR trade_filter = '' OR wp.trade_primary = trade_filter OR wp.trade = trade_filter)
ORDER BY distance_km ASC
LIMIT 20;
$$ LANGUAGE SQL STABLE;
