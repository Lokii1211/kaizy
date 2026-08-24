-- ════════════════════════════════════════════════════════
-- 009_worker_locations.sql — Live Worker GPS Tracking Table
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS worker_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  heading DECIMAL(5,2) DEFAULT 0,
  speed DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_locations_booking ON worker_locations(booking_id, created_at DESC);
