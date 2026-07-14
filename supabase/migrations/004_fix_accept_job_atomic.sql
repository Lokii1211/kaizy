-- ════════════════════════════════════════
-- Migration 004: Fix accept_job_atomic
-- The 003 version didn't create a booking row.
-- This version properly creates the booking atomically.
-- ════════════════════════════════════════

CREATE OR REPLACE FUNCTION accept_job_atomic(
  p_alert_id uuid,
  p_worker_id uuid
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_alert      job_alerts%ROWTYPE;
  v_session    dispatch_sessions%ROWTYPE;
  v_job_id     uuid;
  v_hirer_id   uuid;
  v_booking_id uuid;
  v_otp        text;
  v_existing   uuid;
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

  -- Cast text job_id to uuid (job_alerts.job_id is text in schema 003)
  v_job_id := v_alert.job_id::uuid;

  -- Check if a booking already exists for this job
  SELECT id INTO v_existing FROM bookings WHERE job_id = v_job_id AND status != 'cancelled' LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'reason', 'already_taken');
  END IF;

  -- Lock dispatch session
  SELECT * INTO v_session
    FROM dispatch_sessions
    WHERE job_id = v_alert.job_id
    FOR UPDATE;

  IF v_session.accepted_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'reason', 'already_taken');
  END IF;

  -- Get hirer from jobs table
  SELECT hirer_id INTO v_hirer_id FROM jobs WHERE id = v_job_id;

  -- Generate 4-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0');

  -- Accept: mark this alert + expire others
  UPDATE job_alerts SET status = 'accepted' WHERE id = p_alert_id;
  UPDATE job_alerts SET status = 'expired'
    WHERE job_id = v_alert.job_id AND id != p_alert_id AND status = 'pending';

  -- Update dispatch session
  UPDATE dispatch_sessions
    SET accepted_by = p_worker_id, status = 'accepted'
    WHERE job_id = v_alert.job_id;

  -- Update job status
  UPDATE jobs SET status = 'booked' WHERE id = v_job_id;

  -- Create booking
  INSERT INTO bookings (job_id, hirer_id, worker_id, status, otp, visit_charge, platform_fee)
  VALUES (v_job_id, v_hirer_id, p_worker_id, 'accepted', v_otp, 49, 5)
  RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'job_id', v_job_id,
    'otp', v_otp,
    'hirer_id', v_hirer_id
  );
END;
$$;
