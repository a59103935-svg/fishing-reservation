CREATE TABLE IF NOT EXISTS trip_cancellations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_date    DATE        NOT NULL UNIQUE,
  reason       TEXT        NOT NULL,
  cancelled_by UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_cancellations_date ON trip_cancellations(trip_date);

ALTER TABLE trip_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY trip_cancellations_select ON trip_cancellations FOR SELECT USING (TRUE);
CREATE POLICY trip_cancellations_insert ON trip_cancellations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY trip_cancellations_delete ON trip_cancellations FOR DELETE USING (auth.role() = 'authenticated');
