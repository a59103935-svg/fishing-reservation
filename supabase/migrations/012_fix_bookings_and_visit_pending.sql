-- ============================================================
-- bookings 컬럼 보완 + visit_pending 상태 추가
-- ============================================================

-- 누락 컬럼 추가
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount    INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name   TEXT    DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone  TEXT    DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email  TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_name    TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date            DATE    DEFAULT CURRENT_DATE;

-- reservation_date → date 마이그레이션 (reservation_date가 있을 경우)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reservation_date'
  ) THEN
    UPDATE bookings SET date = reservation_date WHERE date IS NULL OR date = CURRENT_DATE;
  END IF;
END $$;

-- payment_status CHECK 제약조건 제거 후 재생성 (visit_pending 포함)
DO $$
BEGIN
  -- 기존 check 제약조건 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%payment_status%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE bookings DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'bookings' AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%payment_status%'
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- visit_pending 포함 check 제약조건 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
      CHECK (payment_status IN ('pending', 'visit_pending', 'confirmed', 'cancelled'));
  END IF;
END $$;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
