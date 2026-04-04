-- reservation_date 컬럼이 있는 경우 date 컬럼으로 통일
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- reservation_date → date 데이터 복사 (reservation_date가 존재하는 경우)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reservation_date'
  ) THEN
    UPDATE bookings SET date = reservation_date WHERE date IS NULL;
  END IF;
END $$;
