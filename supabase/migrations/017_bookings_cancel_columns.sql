-- bookings 테이블에 취소 신청 관련 컬럼 추가
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_status text CHECK (cancel_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS refund_amount integer;

-- 인덱스 (취소 신청 목록 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_status ON bookings(cancel_status);
