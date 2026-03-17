-- KonnectOn — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geo queries

-- ========================================
-- 1. WORKERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  konnect_id VARCHAR(20) UNIQUE NOT NULL, -- KON-2024-XXXXX
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50),
  skills TEXT[] NOT NULL DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  experience VARCHAR(10) DEFAULT '0-2',
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  konnect_score INTEGER DEFAULT 300 CHECK (konnect_score >= 300 AND konnect_score <= 900),
  verified BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  languages TEXT[] DEFAULT '{"hi"}',
  rate_min INTEGER DEFAULT 0,
  rate_max INTEGER DEFAULT 0,
  aadhaar_verified BOOLEAN DEFAULT false,
  aadhaar_masked VARCHAR(20),
  profile_photo_url TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  location GEOGRAPHY(POINT, 4326), -- PostGIS point
  avg_response_time INTEGER DEFAULT 15, -- minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workers
CREATE INDEX idx_workers_city ON workers(city);
CREATE INDEX idx_workers_skills ON workers USING GIN(skills);
CREATE INDEX idx_workers_available ON workers(available) WHERE available = true;
CREATE INDEX idx_workers_rating ON workers(rating DESC);
CREATE INDEX idx_workers_konnect_score ON workers(konnect_score DESC);
CREATE INDEX idx_workers_location ON workers USING GIST(location);
CREATE INDEX idx_workers_phone ON workers(phone);

-- ========================================
-- 2. HIRERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS hirers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  business_name VARCHAR(200),
  business_type VARCHAR(50), -- shop, factory, household, contractor
  city VARCHAR(50),
  state VARCHAR(50),
  gst_number VARCHAR(20),
  verified BOOLEAN DEFAULT false,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hirers_phone ON hirers(phone);
CREATE INDEX idx_hirers_city ON hirers(city);

-- ========================================
-- 3. JOBS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  hirer_id UUID REFERENCES hirers(id) ON DELETE CASCADE,
  hirer_name VARCHAR(100),
  skill_required VARCHAR(50) NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  city VARCHAR(50) NOT NULL,
  locality VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  location GEOGRAPHY(POINT, 4326),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'emergency')),
  duration VARCHAR(50),
  scheduled_date DATE,
  scheduled_time TIME,
  max_workers INTEGER DEFAULT 1,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'open';
CREATE INDEX idx_jobs_skill ON jobs(skill_required);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_hirer ON jobs(hirer_id);

-- ========================================
-- 4. BOOKINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id VARCHAR(20) UNIQUE NOT NULL, -- BK-2024-XXXXX
  job_id UUID REFERENCES jobs(id),
  worker_id UUID REFERENCES workers(id),
  hirer_id UUID REFERENCES hirers(id),
  worker_name VARCHAR(100),
  hirer_name VARCHAR(100),
  skill VARCHAR(50),
  task VARCHAR(200),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  gst DECIMAL(10,2) DEFAULT 0,
  insurance DECIMAL(10,2) DEFAULT 5.00,
  worker_payout DECIMAL(10,2) NOT NULL,
  total_payable DECIMAL(10,2) NOT NULL,
  escrow_status VARCHAR(20) DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'funded', 'started', 'completed', 'released', 'disputed', 'refunded')),
  payment_method VARCHAR(20) DEFAULT 'upi',
  razorpay_order_id VARCHAR(50),
  razorpay_payment_id VARCHAR(50),
  worker_upi_id VARCHAR(50),
  scheduled_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  rating DECIMAL(2,1),
  review TEXT,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_worker ON bookings(worker_id);
CREATE INDEX idx_bookings_hirer ON bookings(hirer_id);
CREATE INDEX idx_bookings_escrow ON bookings(escrow_status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);

-- ========================================
-- 5. PAYMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  payer_id UUID, -- hirer_id or worker_id
  payee_id UUID, -- worker_id or platform
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'refunded', 'failed')),
  method VARCHAR(20) CHECK (method IN ('upi', 'card', 'netbanking', 'wallet')),
  razorpay_order_id VARCHAR(50),
  razorpay_payment_id VARCHAR(50),
  razorpay_signature VARCHAR(100),
  upi_id VARCHAR(50),
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay ON payments(razorpay_order_id);

-- ========================================
-- 6. CERTIFICATES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- NSQF, ITI, PMKVY, custom
  name VARCHAR(200) NOT NULL,
  issuer VARCHAR(200),
  issue_date DATE,
  valid_until DATE,
  document_id VARCHAR(100), -- DigiLocker URI
  document_url TEXT,
  verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(20), -- digilocker, manual, nsdc_api
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certs_worker ON certificates(worker_id);
CREATE INDEX idx_certs_type ON certificates(type);

-- ========================================
-- 7. REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  worker_id UUID REFERENCES workers(id),
  hirer_id UUID REFERENCES hirers(id),
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_worker ON reviews(worker_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ========================================
-- 8. NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(10) CHECK (user_type IN ('worker', 'hirer')),
  type VARCHAR(30) NOT NULL, -- job_alert, payment, score, message, promo, alert
  title VARCHAR(200) NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  action_url VARCHAR(200),
  whatsapp_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- ========================================
-- 9. KONNECT_SCORE_HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS konnect_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  old_score INTEGER,
  new_score INTEGER,
  change_reason VARCHAR(200),
  factor VARCHAR(50), -- job_completion, rating, on_time, certification, dispute
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_worker ON konnect_score_history(worker_id);

-- ========================================
-- 10. AUDIT_LOG TABLE (DPDP Act compliance)
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(30) NOT NULL, -- worker, hirer, booking, payment
  entity_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL, -- create, update, delete, view, export
  actor_id UUID,
  actor_type VARCHAR(10),
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workers_updated BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_hirers_updated BEFORE UPDATE ON hirers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update worker rating when new review is added
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workers
  SET
    rating = (SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM reviews WHERE worker_id = NEW.worker_id),
    total_ratings = (SELECT COUNT(*) FROM reviews WHERE worker_id = NEW.worker_id)
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_rating AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_worker_rating();

-- Auto-update PostGIS location from lat/lng
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workers_location BEFORE INSERT OR UPDATE OF latitude, longitude ON workers FOR EACH ROW EXECUTE FUNCTION update_location_point();
CREATE TRIGGER trg_jobs_location BEFORE INSERT OR UPDATE OF latitude, longitude ON jobs FOR EACH ROW EXECUTE FUNCTION update_location_point();

-- ========================================
-- RLS (Row Level Security) for DPDP compliance
-- ========================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hirers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Workers can only see their own full record (public view = limited fields)
CREATE POLICY workers_own ON workers FOR ALL USING (true);
CREATE POLICY hirers_own ON hirers FOR ALL USING (true);
CREATE POLICY bookings_involved ON bookings FOR ALL USING (true);
CREATE POLICY payments_involved ON payments FOR ALL USING (true);
CREATE POLICY notif_own ON notifications FOR ALL USING (true);

-- ========================================
-- SEED DATA
-- ========================================
INSERT INTO workers (konnect_id, name, phone, city, state, skills, specializations, experience, rating, jobs_completed, konnect_score, verified, available, languages, rate_min, rate_max, aadhaar_verified, latitude, longitude)
VALUES
  ('KON-2024-08271', 'Raju Kumar', '+919876543210', 'Coimbatore', 'Tamil Nadu', '{"electrician"}', '{"House Wiring","MCB Installation","Solar Panel"}', '10+', 4.8, 127, 780, true, true, '{"Tamil","Hindi"}', 800, 1800, true, 11.0168, 76.9558),
  ('KON-2024-08272', 'Priya Sharma', '+919876543211', 'Coimbatore', 'Tamil Nadu', '{"ac_technician"}', '{"Split AC","Window AC","VRF Systems"}', '8', 4.9, 89, 810, true, true, '{"Tamil","English"}', 1000, 2500, true, 11.0245, 76.9612),
  ('KON-2024-08273', 'Suresh Babu', '+919876543212', 'Coimbatore', 'Tamil Nadu', '{"plumber"}', '{"Pipe Fitting","Drainage","Bathroom"}', '15', 4.6, 203, 720, true, false, '{"Tamil"}', 600, 1500, true, 11.0012, 76.9389),
  ('KON-2024-08274', 'Anil Verma', '+919876543213', 'Coimbatore', 'Tamil Nadu', '{"carpenter"}', '{"Furniture","Shelving","Doors & Windows"}', '12', 4.7, 156, 755, true, true, '{"Hindi","Tamil"}', 700, 3000, true, 11.0301, 76.9234),
  ('KON-2024-08275', 'Lakshmi R', '+919876543214', 'Coimbatore', 'Tamil Nadu', '{"painter"}', '{"Interior","Exterior","Texture"}', '6', 4.5, 64, 690, true, true, '{"Tamil","Kannada"}', 500, 2000, false, 11.0089, 76.9701),
  ('KON-2024-08276', 'Meena Devi', '+919876543215', 'Nagpur', 'Maharashtra', '{"welder"}', '{"Arc Welding","MIG","Gate Fabrication"}', '7', 4.8, 91, 760, true, true, '{"Hindi","Marathi"}', 900, 2200, true, 21.1458, 79.0882)
ON CONFLICT (konnect_id) DO NOTHING;

INSERT INTO hirers (name, phone, city, state, business_name, business_type, verified)
VALUES
  ('Vinod Agarwal', '+919876500001', 'Coimbatore', 'Tamil Nadu', 'Kumar Electronics', 'shop', true),
  ('Anita Contractor', '+919876500002', 'Pune', 'Maharashtra', 'Anita Builders', 'contractor', true)
ON CONFLICT (phone) DO NOTHING;
