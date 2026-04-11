-- 날짜+버스좌석 중복 예약 방지 (취소된 예약 제외)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_bus_seat
  ON bookings(date, bus_seat_number)
  WHERE payment_status <> 'cancelled' AND bus_seat_number IS NOT NULL;

-- 날짜+배자리 중복 예약 방지 (취소된 예약 제외)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_boat_spot
  ON bookings(date, boat_spot_id)
  WHERE payment_status <> 'cancelled' AND boat_spot_id IS NOT NULL;
