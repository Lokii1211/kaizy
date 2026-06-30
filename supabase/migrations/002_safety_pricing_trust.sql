-- ═══════════════════════════════════════
-- KAIZY — SUPABASE MIGRATION V2
-- New tables for safety, pricing, trust, and disciplinary features
-- Run this AFTER the base migration (V1)
-- ═══════════════════════════════════════

-- ─── WORKER STRIKES (Disciplinary System) ───
CREATE TABLE IF NOT EXISTS worker_strikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('no_show', 'late', 'poor_quality', 'rude_behavior', 'overcharge', 'fake_review', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  reported_by TEXT NOT NULL,
  booking_id UUID,
  evidence TEXT,
  action_taken TEXT NOT NULL,
  suspension_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVIEW FRAUD CHECKS ───
CREATE TABLE IF NOT EXISTS review_fraud_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  reviewer_id UUID REFERENCES users(id),
  target_id UUID REFERENCES users(id),
  rating INTEGER NOT NULL,
  trust_score INTEGER NOT NULL,
  flags JSONB DEFAULT '[]',
  verdict TEXT NOT NULL CHECK (verdict IN ('approved', 'flagged', 'auto_removed')),
  ip_address TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DELETION REQUESTS (DPDP Act) ───
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending_payout', 'completed', 'cancelled')),
  pending_bookings INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ
);

-- ─── ADD NEW COLUMNS TO EXISTING TABLES ───

-- Worker profiles: strike + suspension + ban fields
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS strike_count INTEGER DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS cancellation_count INTEGER DEFAULT 0;

-- Bookings: diagnosis + quote fields (3-stage pricing)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS worker_diagnosis TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS complexity_level TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quoted_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_list JSONB DEFAULT '[]';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_quoted DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_rejected_at TIMESTAMPTZ;

-- Bookings: parts addon fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_addon_list JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_addon_cost DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_addon_status TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_addon_requested_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_addon_approved_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parts_addon_rejected_at TIMESTAMPTZ;

-- Bookings: reassignment fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reassignment_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reassignment_bonus DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reassignment_started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_credit DECIMAL(10,2);

-- Bookings: cancellation fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visit_charge DECIMAL(10,2) DEFAULT 49;

-- Users: deletion request fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- Reviews: fraud detection fields
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS target_id UUID;

-- ─── INDEXES FOR PERFORMANCE ───
CREATE INDEX IF NOT EXISTS idx_worker_strikes_worker ON worker_strikes(worker_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_booking ON review_fraud_checks(booking_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_reviewer ON review_fraud_checks(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_hirer ON bookings(hirer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(worker_id);

-- ─── ATOMIC JOB ACCEPTANCE FUNCTION ───
CREATE OR REPLACE FUNCTION accept_job(p_alert_id UUID, p_worker_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_job_id UUID;
  v_booking_id UUID;
  v_otp TEXT;
  v_existing UUID;
BEGIN
  -- Check if already accepted
  SELECT worker_id INTO v_existing
  FROM job_alerts
  WHERE id = p_alert_id AND status = 'accepted'
  FOR UPDATE SKIP LOCKED;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_taken');
  END IF;

  -- Mark alert as accepted
  UPDATE job_alerts
  SET status = 'accepted', accepted_by = p_worker_id, accepted_at = NOW()
  WHERE id = p_alert_id AND status = 'pending'
  RETURNING job_id INTO v_job_id;

  IF v_job_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired_or_taken');
  END IF;

  -- Generate OTP
  v_otp := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Create booking
  INSERT INTO bookings (job_id, worker_id, status, otp, created_at)
  VALUES (v_job_id, p_worker_id, 'accepted', v_otp, NOW())
  RETURNING id INTO v_booking_id;

  -- Update job
  UPDATE jobs SET status = 'accepted', worker_id = p_worker_id WHERE id = v_job_id;

  -- Expire other alerts for same job
  UPDATE job_alerts SET status = 'expired' WHERE job_id = v_job_id AND id != p_alert_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'job_id', v_job_id,
    'otp', v_otp
  );
END;
$$ LANGUAGE plpgsql;
