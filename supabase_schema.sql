-- ═══════════════════════════════════════════════════════
-- KAIZY — COMPLETE PRODUCTION DATABASE SCHEMA
-- Run this ENTIRE block in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════
-- DROP OLD TABLES (from previous schema) to recreate cleanly
-- Order matters due to foreign key dependencies
-- ═══════════════════════════════════════════════════════
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS worker_locations CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS job_alerts CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Also drop old functions/triggers
DROP FUNCTION IF EXISTS accept_job(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;

-- ══ USERS ══
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(13) UNIQUE NOT NULL,
  name VARCHAR(100),
  user_type TEXT CHECK (user_type IN ('worker','hirer')) NOT NULL DEFAULT 'hirer',
  profile_photo TEXT,
  city TEXT DEFAULT 'Coimbatore',
  area TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══ OTP CODES ══
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(13) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, expires_at);

-- ══ WORKER PROFILES ══
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trade_primary TEXT NOT NULL,
  trades_secondary TEXT[] DEFAULT '{}',
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rate_hourly NUMERIC(8,2) DEFAULT 400,
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 100,
  kaizy_score INTEGER DEFAULT 300,
  aadhaar_verified BOOLEAN DEFAULT FALSE,
  upi_id TEXT,
  razorpay_account_id TEXT,
  last_online_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══ PRICING RULES ══
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  display_name TEXT,
  base_price NUMERIC(8,2) NOT NULL,
  price_per_km NUMERIC(6,2) DEFAULT 10,
  night_multiplier NUMERIC(3,2) DEFAULT 1.5,
  emergency_multiplier NUMERIC(3,2) DEFAULT 1.8,
  weekend_multiplier NUMERIC(3,2) DEFAULT 1.2,
  duration_minutes INTEGER DEFAULT 60,
  icon TEXT DEFAULT '🔧',
  UNIQUE(trade, problem_type)
);

-- ══ JOBS ══
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hirer_id UUID REFERENCES users(id),
  trade TEXT NOT NULL,
  problem_type TEXT,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  address TEXT,
  job_type TEXT DEFAULT 'instant' CHECK (job_type IN ('instant','scheduled','emergency')),
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal','urgent','emergency')),
  status TEXT DEFAULT 'searching' CHECK (status IN ('searching','booked','in_progress','completed','cancelled','no_workers','expired')),
  estimated_price NUMERIC(8,2),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══ BOOKINGS ══
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  hirer_id UUID REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','en_route','arrived','working','completed','cancelled','disputed')),
  worker_rate NUMERIC(8,2),
  distance_km NUMERIC(6,2),
  distance_charge NUMERIC(8,2) DEFAULT 0,
  night_surcharge NUMERIC(8,2) DEFAULT 0,
  emergency_surcharge NUMERIC(8,2) DEFAULT 0,
  platform_fee NUMERIC(8,2),
  insurance_fee NUMERIC(6,2) DEFAULT 5,
  total_amount NUMERIC(8,2),
  net_to_worker NUMERIC(8,2),
  otp VARCHAR(4),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','order_created','captured','released','refunded','failed')),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══ JOB ALERTS (Rapido-style dispatch) ══
CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id),
  dispatch_round INTEGER DEFAULT 1,
  estimated_earnings NUMERIC(8,2),
  distance_km NUMERIC(6,2),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','expired','missed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 seconds'),
  responded_at TIMESTAMPTZ,
  UNIQUE(job_id, worker_id)
);

-- ══ MESSAGES ══
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','image','audio','location','system','quick_reply')),
  content TEXT,
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══ REVIEWS ══
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) UNIQUE,
  reviewer_id UUID REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══ WORKER LOCATION UPDATES ══
CREATE TABLE IF NOT EXISTS worker_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  heading NUMERIC(5,2),
  speed NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wloc_booking ON worker_locations(booking_id, recorded_at DESC);

-- ══ NOTIFICATIONS ══
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at DESC);

-- ══ EARNINGS LEDGER ══
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  amount NUMERIC(8,2) NOT NULL,
  type TEXT DEFAULT 'job_payment' CHECK (type IN ('job_payment','bonus','referral','tip','penalty')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','credited','withdrawn')),
  upi_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- ATOMIC JOB ACCEPT FUNCTION (race-condition safe)
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION accept_job(p_alert_id UUID, p_worker_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_alert job_alerts%ROWTYPE;
  v_job jobs%ROWTYPE;
  v_booking_id UUID;
  v_otp VARCHAR(4);
BEGIN
  -- Lock the alert row (skip if already locked by another worker)
  SELECT * INTO v_alert FROM job_alerts
  WHERE id = p_alert_id AND worker_id = p_worker_id
  AND status = 'sent' AND expires_at > NOW()
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'alert_expired_or_taken');
  END IF;

  -- Check job not already booked
  SELECT * INTO v_job FROM jobs WHERE id = v_alert.job_id AND status = 'searching' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'job_already_booked');
  END IF;

  -- Generate 4-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Accept alert
  UPDATE job_alerts SET status = 'accepted', responded_at = NOW() WHERE id = p_alert_id;

  -- Expire all other alerts for this job
  UPDATE job_alerts SET status = 'expired' WHERE job_id = v_alert.job_id AND id != p_alert_id;

  -- Update job status
  UPDATE jobs SET status = 'booked', updated_at = NOW() WHERE id = v_alert.job_id;

  -- Create booking
  INSERT INTO bookings (job_id, hirer_id, worker_id, worker_rate, total_amount, platform_fee, net_to_worker, otp, status, accepted_at)
  VALUES (
    v_alert.job_id, v_job.hirer_id, p_worker_id,
    v_job.estimated_price,
    ROUND(v_job.estimated_price * 1.10 + 5, 2),
    ROUND(v_job.estimated_price * 0.10, 2),
    v_job.estimated_price,
    v_otp, 'accepted', NOW()
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'job_id', v_alert.job_id,
    'otp', v_otp
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════
-- AUTO-UPDATE TRIGGER
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_ts') THEN
    CREATE TRIGGER trg_users_ts BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jobs_ts') THEN
    CREATE TRIGGER trg_jobs_ts BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bookings_ts') THEN
    CREATE TRIGGER trg_bookings_ts BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_worker_profiles_ts') THEN
    CREATE TRIGGER trg_worker_profiles_ts BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════
-- SEED PRICING DATA (19 problem types)
-- ═══════════════════════════════════════════════════════
INSERT INTO pricing_rules (trade, problem_type, display_name, base_price, price_per_km, duration_minutes, icon) VALUES
('electrician','fan_repair','Fan Not Working',150,10,45,'⚡'),
('electrician','switch_repair','Switch/Socket Repair',100,10,30,'⚡'),
('electrician','wiring_fault','Wiring Issue',300,15,90,'⚡'),
('electrician','mcb_trip','MCB Tripping',150,10,30,'⚡'),
('electrician','ac_wiring','AC Wiring',400,15,120,'⚡'),
('electrician','inverter','Inverter Install',400,15,90,'⚡'),
('plumber','tap_repair','Tap Repair',150,10,30,'🔧'),
('plumber','pipe_leak','Pipe Leak',300,15,60,'🔧'),
('plumber','drain_block','Drainage Block',250,12,45,'🔧'),
('plumber','toilet_repair','Toilet Repair',350,15,60,'🔧'),
('mechanic','tyre_puncture','Tyre Puncture',200,15,30,'🚗'),
('mechanic','battery_jump','Battery Jump Start',300,20,20,'🚗'),
('mechanic','engine_stall','Engine Stall',600,20,90,'🚗'),
('mechanic','car_towing','Car Towing',800,25,120,'🚗'),
('ac_repair','not_cooling','AC Not Cooling',400,15,60,'❄️'),
('ac_repair','gas_refill','Gas Refill',800,20,60,'❄️'),
('ac_repair','cleaning','AC Cleaning',350,15,45,'❄️'),
('carpenter','door_fix','Door Repair',300,15,45,'🪚'),
('painter','room_painting','Room Painting',1500,20,300,'🎨')
ON CONFLICT (trade, problem_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- SEED 5 DEMO WORKERS (for testing)
-- ═══════════════════════════════════════════════════════
INSERT INTO users (id, phone, name, user_type, city, latitude, longitude) VALUES
('a1111111-1111-1111-1111-111111111111', '+919876543001', 'Raju Kumar', 'worker', 'Coimbatore', 11.0180, 76.9570),
('a2222222-2222-2222-2222-222222222222', '+919876543002', 'Meena Devi', 'worker', 'Coimbatore', 11.0155, 76.9620),
('a3333333-3333-3333-3333-333333333333', '+919876543003', 'Suresh Muthu', 'worker', 'Coimbatore', 11.0200, 76.9500),
('a4444444-4444-4444-4444-444444444444', '+919876543004', 'Deepa Kannan', 'worker', 'Coimbatore', 11.0165, 76.9610),
('a5555555-5555-5555-5555-555555555555', '+919876543005', 'Arun Prakash', 'worker', 'Coimbatore', 11.0120, 76.9530)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO worker_profiles (id, trade_primary, experience_years, rate_hourly, is_online, avg_rating, total_jobs, kaizy_score, aadhaar_verified, latitude, longitude) VALUES
('a1111111-1111-1111-1111-111111111111', 'electrician', 8, 500, true, 4.9, 312, 742, true, 11.0180, 76.9570),
('a2222222-2222-2222-2222-222222222222', 'plumber', 5, 400, true, 4.7, 187, 650, true, 11.0155, 76.9620),
('a3333333-3333-3333-3333-333333333333', 'mechanic', 12, 600, true, 4.8, 520, 810, true, 11.0200, 76.9500),
('a4444444-4444-4444-4444-444444444444', 'ac_repair', 3, 650, true, 4.8, 95, 580, false, 11.0165, 76.9610),
('a5555555-5555-5555-5555-555555555555', 'carpenter', 6, 550, true, 4.6, 240, 690, true, 11.0120, 76.9530)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (enable after testing)
-- ═══════════════════════════════════════════════════════
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ENABLE REALTIME on these tables via Supabase Dashboard:
-- → Database → Replication → Toggle ON for:
-- bookings, job_alerts, messages, worker_locations, notifications, worker_profiles
