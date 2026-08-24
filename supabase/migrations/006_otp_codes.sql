-- ════════════════════════════════════════════════════════
-- 006_otp_codes.sql — Real WhatsApp / Phone OTP Store
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS otp_codes (
  phone       VARCHAR(15) PRIMARY KEY,
  otp         VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_created ON otp_codes(phone, created_at DESC);

-- Enable RLS & service role full access
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on otp_codes"
  ON otp_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
