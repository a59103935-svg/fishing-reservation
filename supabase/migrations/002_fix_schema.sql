-- ============================================
-- 002: 스키마 수정
-- ============================================

-- 1. payment_status CHECK에 visit_pending 추가
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'confirmed', 'visit_pending', 'cancelled'));

-- 2. reservation_date 컬럼이 있으면 NOT NULL 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reservation_date'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN reservation_date DROP NOT NULL;
  END IF;
END $$;

-- 3. 누락 컬럼 추가 (없으면)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount INTEGER NOT NULL DEFAULT 0;

-- 4. PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
