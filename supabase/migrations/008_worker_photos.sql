-- ════════════════════════════════════════════════════════
-- 008_worker_photos.sql — Portfolio Photos Table
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS worker_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_photos_worker_id ON worker_photos(worker_id);
