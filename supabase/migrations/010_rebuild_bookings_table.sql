-- ============================================================
-- bookings 테이블 완전 재구성
-- 테이블이 없으면 생성, 있으면 누락 컬럼만 추가
-- ============================================================

-- 1. 테이블이 없으면 전체 생성
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number   TEXT        NOT NULL UNIQUE,
  date             DATE        NOT NULL,
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT        NOT NULL,
  bus_seat_number  INTEGER,
  boat_spot_id     TEXT,
  payment_method   TEXT        NOT NULL DEFAULT 'bank',
  payment_status   TEXT        NOT NULL DEFAULT 'pending',
  total_amount     INTEGER     NOT NULL DEFAULT 0,
  depositor_name   TEXT,
  pg_tid           TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ
);

-- 2. 테이블이 이미 있을 경우 누락 컬럼 추가
--    NOT NULL 컬럼은 DEFAULT를 함께 지정해 기존 행 충돌 방지

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_number  TEXT        DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date            DATE        DEFAULT CURRENT_DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name   TEXT        DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone  TEXT        DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bus_seat_number INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS boat_spot_id    TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method  TEXT        DEFAULT 'bank';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status  TEXT        DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount    INTEGER     DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS depositor_name  TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pg_tid          TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at    TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at    TIMESTAMPTZ;

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_date           ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- 4. RLS (없으면 추가)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_insert_anon'
  ) THEN
    CREATE POLICY bookings_insert_anon   ON bookings FOR INSERT WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_select_all'
  ) THEN
    CREATE POLICY bookings_select_all    ON bookings FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_update_admin'
  ) THEN
    CREATE POLICY bookings_update_admin  ON bookings FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_delete_admin'
  ) THEN
    CREATE POLICY bookings_delete_admin  ON bookings FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
