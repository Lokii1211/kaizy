-- ============================================================
-- KAIZY — COMPLETE SUPABASE/POSTGRESQL SCHEMA
-- Run this in Supabase SQL Editor → New Query → Execute
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ═══ USERS ═══
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           VARCHAR(13) UNIQUE NOT NULL,
  user_type       TEXT CHECK (user_type IN ('worker','hirer','both','contractor')),
  name            VARCHAR(100),
  profile_photo   TEXT,
  language        VARCHAR(10) DEFAULT 'hi',
  fcm_token       TEXT,
  whatsapp_optin  BOOLEAN DEFAULT TRUE,
  aadhaar_verified BOOLEAN DEFAULT FALSE,
  phone_verified  BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ═══ WORKER PROFILES ═══
CREATE TABLE IF NOT EXISTS worker_profiles (
  id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trade_primary     TEXT NOT NULL,
  trade_secondary   TEXT[],
  bio               TEXT,
  rate_base         NUMERIC(8,2),
  rate_per_km       NUMERIC(6,2) DEFAULT 10,
  rate_night_mult   NUMERIC(3,2) DEFAULT 1.5,
  rate_emergency_mult NUMERIC(3,2) DEFAULT 1.8,
  rate_holiday_mult NUMERIC(3,2) DEFAULT 2.0,
  experience_years  INTEGER DEFAULT 0,
  verification_level INTEGER DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 4),
  is_online         BOOLEAN DEFAULT FALSE,
  is_available      BOOLEAN DEFAULT TRUE,
  current_location  GEOGRAPHY(POINT, 4326),
  home_location     GEOGRAPHY(POINT, 4326),
  service_radius_km INTEGER DEFAULT 15,
  avg_rating        NUMERIC(3,2) DEFAULT 0.00,
  total_jobs        INTEGER DEFAULT 0,
  total_earnings    NUMERIC(12,2) DEFAULT 0,
  completion_rate   NUMERIC(5,2) DEFAULT 100,
  response_rate     NUMERIC(5,2) DEFAULT 100,
  avg_response_secs INTEGER DEFAULT 60,
  kaizy_score       INTEGER DEFAULT 300,
  kaizy_score_band  TEXT DEFAULT 'new',
  loan_eligible     BOOLEAN DEFAULT FALSE,
  max_loan_amount   NUMERIC(10,2) DEFAULT 0,
  razorpayx_account TEXT,
  vehicle_type      TEXT,
  has_vehicle       BOOLEAN DEFAULT FALSE,
  last_location_at  TIMESTAMPTZ,
  last_online_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_worker_location ON worker_profiles USING GIST (current_location);
CREATE INDEX IF NOT EXISTS idx_worker_trade ON worker_profiles (trade_primary, is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_worker_rating ON worker_profiles (avg_rating DESC);

-- ═══ WORKER LOCATIONS (for real-time tracking) ═══
CREATE TABLE IF NOT EXISTS worker_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  location    GEOGRAPHY(POINT, 4326) NOT NULL,
  heading     NUMERIC(5,2),
  speed       NUMERIC(6,2),
  accuracy    NUMERIC(6,2),
  booking_id  UUID,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wloc_worker ON worker_locations (worker_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wloc_booking ON worker_locations (booking_id, recorded_at DESC);

-- ═══ WORKER SKILLS ═══
CREATE TABLE IF NOT EXISTS worker_skills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id         UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  skill_name        TEXT NOT NULL,
  skill_category    TEXT,
  years_experience  INTEGER DEFAULT 0,
  is_primary        BOOLEAN DEFAULT FALSE,
  is_verified       BOOLEAN DEFAULT FALSE,
  verified_by       TEXT,
  cert_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, skill_name)
);

-- ═══ PRICING RULES ═══
CREATE TABLE IF NOT EXISTS pricing_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_category  TEXT NOT NULL,
  problem_type    TEXT NOT NULL,
  city_code       TEXT DEFAULT 'DEFAULT',
  base_price      NUMERIC(8,2) NOT NULL,
  price_per_km    NUMERIC(6,2) DEFAULT 10,
  min_price       NUMERIC(8,2),
  max_price       NUMERIC(8,2),
  duration_mins   INTEGER,
  night_mult      NUMERIC(3,2) DEFAULT 1.5,
  emergency_mult  NUMERIC(3,2) DEFAULT 1.8,
  rain_mult       NUMERIC(3,2) DEFAULT 1.3,
  holiday_mult    NUMERIC(3,2) DEFAULT 2.0,
  demand_surge_mult NUMERIC(3,2) DEFAULT 1.0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_category, problem_type, city_code)
);

-- ═══ JOBS ═══
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hirer_id        UUID REFERENCES users(id),
  title           TEXT,
  description     TEXT,
  trade_required  TEXT NOT NULL,
  problem_type    TEXT,
  skills_required TEXT[],
  location        GEOGRAPHY(POINT, 4326),
  address_text    TEXT,
  address_landmark TEXT,
  city            TEXT,
  job_type        TEXT DEFAULT 'instant' CHECK (job_type IN ('instant','scheduled','project','emergency')),
  urgency         TEXT DEFAULT 'normal' CHECK (urgency IN ('emergency','urgent','normal')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','matching','booked','in_progress','completed','cancelled','expired')),
  estimated_price NUMERIC(8,2),
  min_price       NUMERIC(8,2),
  max_price       NUMERIC(8,2),
  final_price     NUMERIC(8,2),
  scheduled_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  photos          TEXT[],
  voice_note_url  TEXT,
  matched_workers UUID[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_job_location ON jobs USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_job_status ON jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_trade ON jobs (trade_required, status);

-- ═══ BOOKINGS ═══
CREATE TABLE IF NOT EXISTS bookings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                  UUID REFERENCES jobs(id),
  hirer_id                UUID REFERENCES users(id),
  worker_id               UUID REFERENCES worker_profiles(id),
  status                  TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','accepted','worker_en_route','worker_arrived',
    'in_progress','completed','disputed','resolved',
    'cancelled_hirer','cancelled_worker','expired','refunded'
  )),
  price_breakdown         JSONB,
  worker_rate             NUMERIC(8,2),
  distance_km             NUMERIC(6,2),
  distance_charge         NUMERIC(8,2),
  night_surcharge         NUMERIC(8,2) DEFAULT 0,
  emergency_surcharge     NUMERIC(8,2) DEFAULT 0,
  platform_fee            NUMERIC(8,2),
  insurance_fee           NUMERIC(6,2) DEFAULT 5,
  gst_amount              NUMERIC(8,2) DEFAULT 0,
  total_amount            NUMERIC(8,2),
  net_to_worker           NUMERIC(8,2),
  worker_accepted_at      TIMESTAMPTZ,
  worker_departed_at      TIMESTAMPTZ,
  worker_arrived_at       TIMESTAMPTZ,
  job_started_at          TIMESTAMPTZ,
  job_completed_at        TIMESTAMPTZ,
  estimated_arrival_mins  INTEGER,
  otp                     VARCHAR(6),
  hirer_confirmed         BOOLEAN DEFAULT FALSE,
  auto_release_at         TIMESTAMPTZ,
  cancellation_reason     TEXT,
  cancellation_fee        NUMERIC(8,2) DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_booking_worker ON bookings (worker_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_hirer ON bookings (hirer_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings (status, created_at DESC);

-- ═══ PAYMENTS ═══
CREATE TABLE IF NOT EXISTS payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID REFERENCES bookings(id),
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT,
  amount_paise          INTEGER NOT NULL,
  currency              TEXT DEFAULT 'INR',
  status                TEXT DEFAULT 'created' CHECK (status IN (
    'created','authorized','captured','escrow_hold',
    'transfer_initiated','settled_to_worker',
    'refund_initiated','refunded','failed'
  )),
  payment_method        TEXT,
  upi_id                TEXT,
  worker_settled_at     TIMESTAMPTZ,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ MESSAGES ═══
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES users(id),
  sender_type   TEXT CHECK (sender_type IN ('hirer','worker','system','ops')),
  message_type  TEXT DEFAULT 'text' CHECK (message_type IN ('text','voice','image','quick_reply','system','location')),
  content       TEXT,
  media_url     TEXT,
  is_read       BOOLEAN DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_booking ON messages (booking_id, created_at);

-- ═══ NOTIFICATIONS ═══
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id),
  type          TEXT NOT NULL,
  title         TEXT,
  body          TEXT,
  title_hi      TEXT,
  body_hi       TEXT,
  data          JSONB DEFAULT '{}',
  channel       TEXT[] DEFAULT '{push}',
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','read')),
  priority      TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, status, created_at DESC);

-- ═══ REVIEWS ═══
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID REFERENCES bookings(id) UNIQUE,
  reviewer_id   UUID REFERENCES users(id),
  reviewee_id   UUID REFERENCES users(id),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags          TEXT[],
  comment       TEXT,
  voice_url     TEXT,
  photos        TEXT[],
  reply_text    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ JOB ALERTS (Rapido-style dispatch) ═══
CREATE TABLE IF NOT EXISTS job_alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id       UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sent','viewed','accepted','declined','expired')),
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 seconds'),
  responded_at    TIMESTAMPTZ,
  decline_reason  TEXT,
  priority_rank   INTEGER DEFAULT 1,
  UNIQUE(job_id, worker_id)
);

-- ═══ AUDIT LOG ═══
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL,
  actor_id    UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ AUTO-UPDATE TRIGGER ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER worker_updated_at BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══ ROW LEVEL SECURITY ═══
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: own profile only
CREATE POLICY users_own ON users FOR ALL USING (auth.uid() = id);

-- Notifications: own only
CREATE POLICY notif_own ON notifications FOR ALL USING (user_id = auth.uid());

-- ═══ SEED PRICING RULES ═══
INSERT INTO pricing_rules (trade_category, problem_type, base_price, price_per_km, min_price, max_price, duration_mins) VALUES
('electrical','fan_repair',150,10,100,400,45),
('electrical','switch_repair',100,10,80,250,30),
('electrical','wiring_fault',300,15,200,800,90),
('electrical','mcb_trip',150,10,100,350,30),
('electrical','ac_wiring',400,15,300,1000,120),
('electrical','complete_rewiring',1500,20,1000,5000,480),
('electrical','inverter_battery',400,15,300,900,90),
('electrical','meter_issue',200,10,150,500,45),
('plumbing','tap_repair',150,10,100,350,30),
('plumbing','pipe_leak',300,15,200,700,60),
('plumbing','drain_block',250,12,200,600,45),
('plumbing','toilet_repair',350,15,250,800,60),
('plumbing','water_motor',500,20,400,1200,90),
('plumbing','pipe_burst_emergency',800,20,600,2000,90),
('plumbing','bathroom_fitting',600,18,500,1500,120),
('mechanic','tyre_puncture',200,15,150,500,30),
('mechanic','battery_jumpstart',300,20,250,700,20),
('mechanic','engine_stall',600,20,500,1500,90),
('mechanic','tyre_change',250,15,200,600,30),
('mechanic','car_towing',800,25,600,2000,120),
('mechanic','breakdown_diagnosis',400,20,300,900,60),
('mechanic','oil_change',350,15,300,700,45),
('mechanic','brake_issue',700,20,600,1500,90),
('ac_repair','ac_not_cooling',400,15,350,900,60),
('ac_repair','ac_gas_refill',800,20,700,1500,60),
('ac_repair','ac_cleaning',350,15,300,700,45),
('ac_repair','ac_installation',1200,25,1000,2500,180),
('ac_repair','ac_pcb_repair',600,20,500,1200,90),
('ac_repair','ac_compressor',1500,25,1200,3000,180),
('carpentry','door_fix',300,15,250,700,45),
('carpentry','furniture_repair',400,15,350,900,60),
('carpentry','lock_repair',200,12,150,500,30),
('carpentry','window_fix',350,15,300,800,60),
('painting','room_painting',1500,20,1200,4000,300),
('painting','wall_repair',400,15,300,900,60),
('painting','waterproofing',2000,25,1500,6000,480)
ON CONFLICT (trade_category, problem_type, city_code) DO NOTHING;

-- ═══ ENABLE REALTIME (do this in Supabase Dashboard) ═══
-- Dashboard > Database > Replication > Toggle ON for:
-- worker_locations, bookings, messages, notifications, job_alerts
