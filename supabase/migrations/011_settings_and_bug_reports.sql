-- ════════════════════════════════════════════════════════
-- 011_settings_and_bug_reports.sql — Settings Preferences & Bug Reports
-- ════════════════════════════════════════════════════════

-- Notification preferences JSONB column
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{
  "push_job_alerts": true,
  "push_bookings": true,
  "push_payments": true,
  "whatsapp_alerts": true,
  "whatsapp_bookings": true
}'::jsonb;

-- Language column
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id),
  category       TEXT NOT NULL,
  description    TEXT NOT NULL,
  screenshot_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
