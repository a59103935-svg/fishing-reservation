-- bookings 테이블에 boat_spot_id 컬럼 추가
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS boat_spot_id TEXT;
