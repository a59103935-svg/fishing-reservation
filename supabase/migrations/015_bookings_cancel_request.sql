-- bookings 테이블에 취소 신청 관련 컬럼 추가
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
