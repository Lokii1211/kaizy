-- ════════════════════════════════════════════════════════
-- Migration 005: Production Schema Additions
-- Safe to run on existing DB — only adds, never drops
-- Based on production master prompt requirements
-- ════════════════════════════════════════════════════════

-- ── jobs table: add missing columns ──────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'instant' CHECK (job_type IN ('sos','instant','later','scheduled')),
  ADD COLUMN IF NOT EXISTS est_price_min DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS est_price_max DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- ── bookings: add production columns ─────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS net_to_worker DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS before_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS after_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diagnosis_note TEXT,
  ADD COLUMN IF NOT EXISTS worker_quote DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hirer_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS departed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS insurance_fee DECIMAL(6,2) DEFAULT 5;

-- Expand bookings.status to include quote flow states
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
  'accepted','en_route','arrived','quote_sent',
  'quote_approved','working','in_progress','completed',
  'confirmed','disputed','cancelled','refunded'
));

-- ── job_alerts: add distance and rank columns ─────────────
ALTER TABLE job_alerts
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS priority_rank INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Expand job_alerts.status to include viewed/declined
ALTER TABLE job_alerts DROP CONSTRAINT IF EXISTS job_alerts_status_check;
ALTER TABLE job_alerts ADD CONSTRAINT job_alerts_status_check CHECK (
  status IN ('sent','pending','viewed','accepted','declined','expired')
);

-- ── worker_profiles: add missing columns ─────────────────
ALTER TABLE worker_profiles
  ADD COLUMN IF NOT EXISTS night_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS verification_lvl INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cert_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS razorpay_acct_id TEXT,
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMPTZ;

-- ── market_pricing table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS market_pricing (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade                 TEXT NOT NULL,
  problem_type          TEXT NOT NULL,
  display_name          TEXT NOT NULL,
  price_min             DECIMAL(8,2) NOT NULL,
  price_max             DECIMAL(8,2) NOT NULL,
  duration_min          INTEGER DEFAULT 60,
  UNIQUE(trade, problem_type)
);

-- Add optional columns if the table already existed without them
ALTER TABLE market_pricing
  ADD COLUMN IF NOT EXISTS display_name_ta       TEXT,
  ADD COLUMN IF NOT EXISTS display_name_hi       TEXT,
  ADD COLUMN IF NOT EXISTS emergency_eligible    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS emergency_multiplier  DECIMAL(3,2) DEFAULT 1.80,
  ADD COLUMN IF NOT EXISTS night_multiplier      DECIMAL(3,2) DEFAULT 1.50,
  ADD COLUMN IF NOT EXISTS sort_order            INTEGER DEFAULT 0;

-- Seed market_pricing with comprehensive data
INSERT INTO market_pricing (trade, problem_type, display_name, display_name_ta, price_min, price_max, duration_min) VALUES
('electrician','fan_repair','Fan / Light repair','மின்விசிறி சரிசெய்தல்',150,300,45),
('electrician','mcb_repair','MCB / Switchboard','MCB பழுது',200,400,30),
('electrician','wiring_fault','Wiring fault','மின்கம்பி பிரச்சினை',300,700,90),
('electrician','full_wiring','Full room wiring','முழு அறை மின்கம்பி',800,2500,240),
('electrician','ac_wiring','AC electrical work','AC மின் வேலை',400,900,120),
('electrician','inverter','Inverter / Battery','இன்வர்டர்',500,1000,90),
('electrician','cctv','CCTV / Smart home','CCTV நிறுவல்',600,2000,180),
('plumber','tap_repair','Tap / Pipe repair','குழாய் பழுது',150,300,30),
('plumber','pipe_leak','Pipe leak','குழாய் கசிவு',250,600,60),
('plumber','drain_block','Drain cleaning','வடிகால் சுத்தம்',200,500,45),
('plumber','toilet_repair','Toilet repair','கழிவறை பழுது',300,700,60),
('plumber','water_motor','Water motor / Pump','மோட்டார் பழுது',500,1200,90),
('plumber','pipe_burst','Pipe burst (emergency)','குழாய் வெடித்தல்',600,2000,90),
('mechanic','puncture_bike','Tyre puncture (bike)','பைக் பஞ்சர்',80,150,20),
('mechanic','puncture_car','Tyre puncture (car)','கார் பஞ்சர்',150,280,25),
('mechanic','puncture_truck','Tyre puncture (truck)','டிரக் பஞ்சர்',250,500,45),
('mechanic','battery_jump','Battery jumpstart','பேட்டரி ஜம்ப்',250,400,20),
('mechanic','engine_stall','Engine stall / breakdown','என்ஜின் பழுது',500,1200,90),
('mechanic','car_towing','Car towing','வாகன இழுப்பு',600,1500,120),
('mechanic','brake_issue','Brake issue','பிரேக் பழுது',400,900,60),
('ac_repair','not_cooling','AC not cooling','AC குளிர்விக்கவில்லை',350,800,60),
('ac_repair','gas_refill','Gas refill','கேஸ் நிரப்புதல்',700,1400,60),
('ac_repair','cleaning','AC deep cleaning','AC சுத்தம்',300,600,45),
('ac_repair','installation','AC installation','AC நிறுவல்',1000,2500,180),
('ac_repair','pcb_repair','PCB / board repair','PCB பழுது',500,1200,120),
('carpenter','door_fix','Door / Window repair','கதவு பழுது',250,600,45),
('carpenter','furniture_repair','Furniture repair','மரச்சாமான் பழுது',350,800,60),
('carpenter','lock_repair','Lock repair / change','பூட்டு பழுது',150,400,30),
('painter','room_painting','Room painting','அறை வர்ணம்',1500,4000,300),
('painter','wall_patch','Wall patch / repair','சுவர் பழுது',300,800,60),
('mason','tile_fix','Tile repair / fixing','ஓடு பழுது',400,1000,90),
('mason','waterproof','Waterproofing','நீர்ப்புகா',1000,4000,240)
ON CONFLICT (trade, problem_type) DO NOTHING;

-- ── worker_locations table (GPS tracking) ─────────────────
CREATE TABLE IF NOT EXISTS worker_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  booking_id  UUID REFERENCES bookings(id),
  latitude    DECIMAL(10,8) NOT NULL,
  longitude   DECIMAL(11,8) NOT NULL,
  heading     DECIMAL(6,2) DEFAULT 0,
  speed       DECIMAL(6,2) DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wloc_booking ON worker_locations(booking_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wloc_worker ON worker_locations(worker_id, recorded_at DESC);

-- ── saved_locations table ────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT DEFAULT 'Home',
  address     TEXT NOT NULL,
  landmark    TEXT,
  latitude    DECIMAL(10,8),
  longitude   DECIMAL(11,8),
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── reviews: add worker_id and positive/negative tags ────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES worker_profiles(id),
  ADD COLUMN IF NOT EXISTS positive_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS negative_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS voice_url TEXT,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Back-fill worker_id from bookings via booking_id (reviews links to bookings, not jobs)
UPDATE reviews r
SET worker_id = b.worker_id
FROM bookings b
WHERE b.id = r.booking_id
  AND r.worker_id IS NULL
  AND r.booking_id IS NOT NULL;

-- ── Realtime: enable on critical tables ─────────────────
-- Run this in Supabase dashboard:
-- Dashboard → Database → Replication → Enable for:
--   bookings, job_alerts, worker_locations, messages, notifications

-- ── Indexes for performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_status_ts ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_hirer ON bookings(hirer_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_worker ON bookings(worker_id, status);
CREATE INDEX IF NOT EXISTS idx_alert_worker_status ON job_alerts(worker_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_market_pricing ON market_pricing(trade, problem_type);

-- ── Auto-release trigger: confirm booking after 24h ─────
CREATE OR REPLACE FUNCTION auto_release_booking()
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'confirmed', confirmed_at = NOW(), hirer_confirmed = TRUE
  WHERE status = 'completed'
    AND hirer_confirmed = FALSE
    AND auto_release_at IS NOT NULL
    AND auto_release_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Set auto_release_at when booking is completed
CREATE OR REPLACE FUNCTION set_auto_release()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.auto_release_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS t_booking_auto_release ON bookings;
CREATE TRIGGER t_booking_auto_release
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_auto_release();

-- ── find_nearby_workers RPC ──────────────────────────────
-- Uses a subquery to compute distance first, then filters + sorts in outer query
-- Avoids the HAVING + non-aggregate column error in plain SQL functions
CREATE OR REPLACE FUNCTION find_nearby_workers(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_trade TEXT,
  p_radius_km INTEGER DEFAULT 10,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avg_rating DECIMAL,
  kaizy_score INTEGER,
  total_jobs INTEGER,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  fcm_token TEXT,
  phone VARCHAR
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    sub.id,
    sub.name,
    sub.avg_rating,
    sub.kaizy_score,
    sub.total_jobs,
    sub.latitude,
    sub.longitude,
    sub.distance_km,
    sub.fcm_token,
    sub.phone
  FROM (
    SELECT
      wp.id,
      u.name,
      wp.avg_rating,
      wp.kaizy_score,
      wp.total_jobs,
      wp.latitude,
      wp.longitude,
      u.fcm_token,
      u.phone,
      COALESCE(wp.completion_rate, 100.0) AS completion_rate,
      COALESCE(wp.response_rate,   100.0) AS response_rate,
      ROUND((6371.0 * acos(
        LEAST(1.0, cos(radians(p_lat)) * cos(radians(wp.latitude))
          * cos(radians(wp.longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(wp.latitude)))
      ))::numeric, 2) AS distance_km
    FROM worker_profiles wp
    JOIN users u ON wp.id = u.id
    WHERE wp.is_online    = TRUE
      AND wp.is_available = TRUE
      AND wp.trade_primary = p_trade
      AND wp.latitude  IS NOT NULL
      AND wp.longitude IS NOT NULL
  ) sub
  WHERE sub.distance_km <= p_radius_km
  ORDER BY
    sub.distance_km                                          * 0.40
    + (5.0 - LEAST(COALESCE(sub.avg_rating, 3.0), 5.0))   * 0.25
    + (100.0 - sub.completion_rate) / 100.0                * 0.20
    + (100.0 - sub.response_rate)   / 100.0                * 0.15
  LIMIT p_limit;
END;
$$;
