-- ════════════════════════════════════════════════════════════════
-- Migration 003: Serverless-safe tables
-- Replaces in-memory Maps in dispatch + tracking + OTP routes.
-- Run in Supabase SQL Editor before deploying to Vercel.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Fix otp_codes — ensure columns exist with correct defaults ──
ALTER TABLE IF EXISTS otp_codes
  ALTER COLUMN used SET DEFAULT false,
  ALTER COLUMN used SET NOT NULL;

ALTER TABLE IF EXISTS otp_codes
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- Allow upsert on phone conflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'otp_codes_phone_key'
  ) THEN
    ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_phone_key UNIQUE (phone);
  END IF;
END $$;

-- ── 2. dispatch_sessions — tracks dispatch round state ──
CREATE TABLE IF NOT EXISTS dispatch_sessions (
  job_id          text PRIMARY KEY,
  trade           text,
  urgency         text NOT NULL DEFAULT 'normal',
  estimated_price integer NOT NULL DEFAULT 500,
  hirer_lat       double precision NOT NULL DEFAULT 0,
  hirer_lng       double precision NOT NULL DEFAULT 0,
  hirer_name      text,
  address         text,
  round           smallint NOT NULL DEFAULT 1,
  price_bump      smallint NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'searching',  -- searching | accepted | expired | cancelled
  accepted_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

-- Auto-expire old sessions
CREATE INDEX IF NOT EXISTS dispatch_sessions_expires_idx ON dispatch_sessions (expires_at);
CREATE INDEX IF NOT EXISTS dispatch_sessions_status_idx ON dispatch_sessions (status);

-- ── 3. job_alerts — one row per worker per dispatch round ──
CREATE TABLE IF NOT EXISTS job_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      text NOT NULL REFERENCES dispatch_sessions(job_id) ON DELETE CASCADE,
  worker_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending',  -- pending | accepted | declined | expired
  round       smallint NOT NULL DEFAULT 1,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_alerts_job_id_idx      ON job_alerts (job_id);
CREATE INDEX IF NOT EXISTS job_alerts_worker_id_idx   ON job_alerts (worker_id);
CREATE INDEX IF NOT EXISTS job_alerts_status_idx      ON job_alerts (status);
CREATE INDEX IF NOT EXISTS job_alerts_expires_idx     ON job_alerts (expires_at);

-- ── 4. tracking_sessions — persisted GPS state per booking ──
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL UNIQUE,
  worker_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'en_route',  -- en_route | arrived | working | completed
  worker_lat  double precision NOT NULL DEFAULT 0,
  worker_lng  double precision NOT NULL DEFAULT 0,
  dest_lat    double precision NOT NULL DEFAULT 0,
  dest_lng    double precision NOT NULL DEFAULT 0,
  heading     double precision NOT NULL DEFAULT 0,
  speed_kmh   real NOT NULL DEFAULT 0,
  eta_minutes integer NOT NULL DEFAULT 0,
  otp         text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  arrived_at  timestamptz,
  completed_at timestamptz,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracking_booking_id_idx  ON tracking_sessions (booking_id);
CREATE INDEX IF NOT EXISTS tracking_worker_id_idx   ON tracking_sessions (worker_id);
CREATE INDEX IF NOT EXISTS tracking_status_idx      ON tracking_sessions (status);

-- Enable Realtime on tracking_sessions so hirers can subscribe to live GPS
ALTER PUBLICATION supabase_realtime ADD TABLE tracking_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE job_alerts;

-- ── 5. accept_job_atomic — race-safe job acceptance function ──
CREATE OR REPLACE FUNCTION accept_job_atomic(
  p_alert_id uuid,
  p_worker_id uuid
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_alert job_alerts%ROWTYPE;
  v_session dispatch_sessions%ROWTYPE;
BEGIN
  -- Lock alert row to prevent concurrent accepts
  SELECT * INTO v_alert
    FROM job_alerts
    WHERE id = p_alert_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_alert.status != 'pending' THEN
    RETURN json_build_object('success', false, 'reason', 'already_taken');
  END IF;

  IF v_alert.expires_at < now() THEN
    UPDATE job_alerts SET status = 'expired' WHERE id = p_alert_id;
    RETURN json_build_object('success', false, 'reason', 'expired');
  END IF;

  -- Lock dispatch session
  SELECT * INTO v_session
    FROM dispatch_sessions
    WHERE job_id = v_alert.job_id
    FOR UPDATE;

  IF v_session.accepted_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'reason', 'already_taken');
  END IF;

  -- Accept: mark alert + session
  UPDATE job_alerts SET status = 'accepted' WHERE id = p_alert_id;
  UPDATE job_alerts SET status = 'expired'
    WHERE job_id = v_alert.job_id AND id != p_alert_id AND status = 'pending';
  UPDATE dispatch_sessions SET accepted_by = p_worker_id, status = 'accepted'
    WHERE job_id = v_alert.job_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_alert.job_id,
    'job_id', v_alert.job_id,
    'otp', LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0')
  );
END;
$$;

-- ── 6. Cleanup job — auto-expire stale dispatch sessions ──
-- Run via pg_cron or a scheduled Supabase edge function:
-- SELECT cron.schedule('expire-dispatch', '*/5 * * * *',
--   $$UPDATE dispatch_sessions SET status='expired'
--     WHERE status='searching' AND expires_at < now()$$);
