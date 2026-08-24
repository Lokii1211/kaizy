-- ════════════════════════════════════════════════════════
-- 010_reviews_and_hirer_reviews.sql — Trust & Two-Sided Reviews
-- ════════════════════════════════════════════════════════

-- Ensure columns exist in reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS positive_tags TEXT[];
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS negative_tags TEXT[];
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- Hirer Reviews table (Workers rating Hirers)
CREATE TABLE IF NOT EXISTS hirer_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID REFERENCES bookings(id),
  reviewer_id UUID REFERENCES users(id),
  hirer_id    UUID REFERENCES users(id),
  rating      INTEGER CHECK (rating BETWEEN 1 AND 3),
  tags        TEXT[],
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hirer_reviews_hirer ON hirer_reviews(hirer_id);
CREATE INDEX IF NOT EXISTS idx_hirer_reviews_booking ON hirer_reviews(booking_id);

-- Recalculate worker rating trigger function
CREATE OR REPLACE FUNCTION update_worker_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_reviews INT;
BEGIN
  SELECT COALESCE(AVG(rating), 5.0), COUNT(*)
  INTO v_avg_rating, v_total_reviews
  FROM reviews
  WHERE worker_id = NEW.worker_id;

  UPDATE worker_profiles
  SET avg_rating = ROUND(v_avg_rating, 2)
  WHERE id = NEW.worker_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_worker_rating ON reviews;
CREATE TRIGGER trg_update_worker_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_worker_rating_stats();
