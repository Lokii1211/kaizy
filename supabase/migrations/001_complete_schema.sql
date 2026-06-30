-- ═══════════════════════════════════════════════════════
-- KAIZY — COMPLETE PRODUCTION DATABASE SCHEMA
-- Run this in Supabase SQL Editor (single execution)
-- ═══════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────
-- 1. USERS (both workers and hirers)
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(15) UNIQUE NOT NULL,
  name          VARCHAR(100),
  user_type     TEXT CHECK (user_type IN ('worker','hirer')),
  profile_photo TEXT,
  language      TEXT DEFAULT 'en',
  fcm_token     TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────
-- 2. WORKER PROFILES
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS worker_profiles (
  id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trade_primary       TEXT NOT NULL,
  trade_secondary     TEXT[],
  bio                 TEXT,
  experience_years    INTEGER DEFAULT 0,
  is_online           BOOLEAN DEFAULT FALSE,
  is_available        BOOLEAN DEFAULT TRUE,
  latitude            DECIMAL(10,8),
  longitude           DECIMAL(11,8),
  service_radius_km   INTEGER DEFAULT 10,
  avg_rating          DECIMAL(3,2) DEFAULT 0,
  total_jobs          INTEGER DEFAULT 0,
  completion_rate     DECIMAL(5,2) DEFAULT 100,
  kaizy_score         INTEGER DEFAULT 300,
  aadhaar_verified    BOOLEAN DEFAULT FALSE,
  upi_id              TEXT,
  availability_days   TEXT[] DEFAULT '{Mon,Tue,Wed,Thu,Fri,Sat,Sun}',
  available_from      TIME DEFAULT '08:00',
  available_to        TIME DEFAULT '20:00',
  night_available     BOOLEAN DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_worker_online ON worker_profiles(is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_worker_trade ON worker_profiles(trade_primary);

-- ────────────────────────────────────────
-- 3. WORKER PRICING (per problem type)
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS worker_pricing (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id     UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  trade         TEXT NOT NULL,
  problem_type  TEXT NOT NULL,
  price_min     DECIMAL(8,2) NOT NULL,
  price_max     DECIMAL(8,2) NOT NULL,
  UNIQUE(worker_id, trade, problem_type)
);

-- ────────────────────────────────────────
-- 4. MARKET PRICING (default prices shown to hirers)
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_pricing (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade                 TEXT NOT NULL,
  problem_type          TEXT NOT NULL,
  display_name          TEXT NOT NULL,
  price_min             DECIMAL(8,2) NOT NULL,
  price_max             DECIMAL(8,2) NOT NULL,
  duration_min          INTEGER DEFAULT 45,
  is_emergency_eligible BOOLEAN DEFAULT TRUE,
  UNIQUE(trade, problem_type)
);

-- ────────────────────────────────────────
-- 5. JOBS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hirer_id        UUID REFERENCES users(id),
  trade           TEXT NOT NULL,
  problem_type    TEXT,
  description     TEXT,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  address         TEXT,
  landmark        TEXT,
  job_type        TEXT DEFAULT 'sos' CHECK (job_type IN ('sos','later')),
  urgency         TEXT DEFAULT 'normal',
  scheduled_for   TIMESTAMPTZ,
  estimated_price DECIMAL(8,2),
  status          TEXT DEFAULT 'searching',
  photos          TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes')
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_hirer ON jobs(hirer_id);

-- ────────────────────────────────────────
-- 6. BOOKINGS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                UUID REFERENCES jobs(id),
  hirer_id              UUID REFERENCES users(id),
  worker_id             UUID REFERENCES users(id),
  status                TEXT DEFAULT 'accepted',
  otp                   TEXT,
  visit_charge          DECIMAL(8,2) DEFAULT 49,
  worker_quote          DECIMAL(8,2),
  worker_diagnosis      TEXT,
  parts_cost            DECIMAL(8,2) DEFAULT 0,
  parts_list            JSONB DEFAULT '[]',
  platform_fee          DECIMAL(8,2),
  total_amount          DECIMAL(8,2),
  net_to_worker         DECIMAL(8,2),
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  payment_status        TEXT DEFAULT 'pending',
  hirer_confirmed       BOOLEAN DEFAULT FALSE,
  quote_sent_at         TIMESTAMPTZ,
  quote_approved_at     TIMESTAMPTZ,
  worker_departed_at    TIMESTAMPTZ,
  worker_arrived_at     TIMESTAMPTZ,
  job_started_at        TIMESTAMPTZ,
  job_completed_at      TIMESTAMPTZ,
  before_photos         TEXT[],
  after_photos          TEXT[],
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_hirer ON bookings(hirer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(worker_id);

-- ────────────────────────────────────────
-- 7. JOB ALERTS (dispatch to workers)
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID REFERENCES jobs(id),
  worker_id     UUID REFERENCES users(id),
  status        TEXT DEFAULT 'sent',
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 seconds'),
  responded_at  TIMESTAMPTZ,
  UNIQUE(job_id, worker_id)
);

-- ────────────────────────────────────────
-- 8. WORKER LOCATION HISTORY (real-time tracking)
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS worker_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID REFERENCES users(id),
  booking_id  UUID REFERENCES bookings(id),
  latitude    DECIMAL(10,8),
  longitude   DECIMAL(11,8),
  heading     DECIMAL(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wloc_booking ON worker_locations(booking_id, recorded_at DESC);

-- ────────────────────────────────────────
-- 9. MESSAGES (real-time chat)
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID REFERENCES bookings(id),
  sender_id   UUID REFERENCES users(id),
  type        TEXT DEFAULT 'text',
  content     TEXT,
  media_url   TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id, created_at);

-- ────────────────────────────────────────
-- 10. REVIEWS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID REFERENCES bookings(id) UNIQUE,
  reviewer_id UUID REFERENCES users(id),
  worker_id   UUID REFERENCES users(id),
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags        TEXT[],
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────
-- 11. NOTIFICATIONS
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  type        TEXT,
  title       TEXT,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ────────────────────────────────────────
-- 12. OTP CODES
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(15) NOT NULL,
  otp         VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER DEFAULT 0,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, created_at DESC);

-- ════════════════════════════════════════
-- SEED: MARKET PRICING (19 problem types)
-- ════════════════════════════════════════
INSERT INTO market_pricing (trade, problem_type, display_name, price_min, price_max, duration_min, is_emergency_eligible)
VALUES
  ('electrician','fan_repair','Fan / Light repair',150,300,45,true),
  ('electrician','mcb_repair','MCB / Switchboard',200,400,30,true),
  ('electrician','wiring_fault','Wiring fault',300,700,90,true),
  ('electrician','ac_wiring','AC electrical work',400,900,120,true),
  ('electrician','inverter','Inverter / Battery',500,1000,90,true),
  ('plumber','tap_repair','Tap / Pipe repair',150,300,30,true),
  ('plumber','pipe_leak','Pipe leak',250,600,60,true),
  ('plumber','drain_block','Drain cleaning',200,500,45,true),
  ('plumber','toilet_repair','Toilet repair',300,700,60,true),
  ('mechanic','puncture_bike','Tyre puncture (bike)',80,150,20,true),
  ('mechanic','puncture_car','Tyre puncture (car)',150,280,25,true),
  ('mechanic','battery_jump','Battery jumpstart',250,400,20,true),
  ('mechanic','engine_stall','Engine stall',500,1200,90,true),
  ('mechanic','car_towing','Car towing',600,1500,120,false),
  ('ac_repair','not_cooling','AC not cooling',350,800,60,true),
  ('ac_repair','gas_refill','Gas refill',700,1400,60,true),
  ('ac_repair','cleaning','AC cleaning',300,600,45,false),
  ('carpenter','door_fix','Door repair',250,600,45,false),
  ('painter','room_painting','Room painting',1500,4000,300,false)
ON CONFLICT (trade, problem_type) DO NOTHING;

-- ════════════════════════════════════════
-- ATOMIC JOB ACCEPTANCE (prevents race conditions)
-- ════════════════════════════════════════
CREATE OR REPLACE FUNCTION accept_job_atomic(
  p_alert_id UUID,
  p_worker_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_job_id UUID;
  v_hirer_id UUID;
  v_booking_id UUID;
  v_otp TEXT;
  v_existing UUID;
BEGIN
  -- Lock and check if already accepted
  SELECT ja.job_id INTO v_job_id
  FROM job_alerts ja
  WHERE ja.id = p_alert_id AND ja.status = 'sent'
  FOR UPDATE SKIP LOCKED;

  IF v_job_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired_or_taken');
  END IF;

  -- Check if job already has someone
  SELECT id INTO v_existing
  FROM bookings
  WHERE job_id = v_job_id AND status != 'cancelled'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_booked');
  END IF;

  -- Get hirer
  SELECT hirer_id INTO v_hirer_id FROM jobs WHERE id = v_job_id;

  -- Generate 4-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Mark alert as accepted
  UPDATE job_alerts
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_alert_id;

  -- Expire all other alerts for same job
  UPDATE job_alerts
  SET status = 'expired', responded_at = NOW()
  WHERE job_id = v_job_id AND id != p_alert_id AND status = 'sent';

  -- Create booking
  INSERT INTO bookings (job_id, hirer_id, worker_id, status, otp, visit_charge, platform_fee)
  VALUES (v_job_id, v_hirer_id, p_worker_id, 'accepted', v_otp, 49, 5)
  RETURNING id INTO v_booking_id;

  -- Update job status
  UPDATE jobs SET status = 'booked' WHERE id = v_job_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'job_id', v_job_id,
    'otp', v_otp,
    'hirer_id', v_hirer_id
  );
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════
-- UPDATE WORKER RATING ON NEW REVIEW
-- ════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE worker_profiles
  SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews WHERE worker_id = NEW.worker_id
    ),
    total_jobs = (
      SELECT COUNT(*) FROM reviews WHERE worker_id = NEW.worker_id
    )
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_worker_rating ON reviews;
CREATE TRIGGER trg_update_worker_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_worker_rating();

-- ════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, anon key uses policies
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON bookings FOR ALL USING (true);
CREATE POLICY "Service role full access" ON messages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true);

-- ════════════════════════════════════════
-- ENABLE REALTIME (run in Supabase Dashboard)
-- Database → Replication → Enable for:
--   bookings, job_alerts, worker_locations, messages, notifications
-- ════════════════════════════════════════
