-- ============================================
-- 낚시 출조 예약 시스템 DB 스키마
-- ============================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 출조 일정 설정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  bus_total_seats INTEGER NOT NULL DEFAULT 30,
  boat_total_spots INTEGER NOT NULL DEFAULT 20,
  bus_price INTEGER NOT NULL DEFAULT 50000,
  boat_price INTEGER NOT NULL DEFAULT 30000,
  departure_time TIME NOT NULL DEFAULT '05:00:00',
  return_time TIME NOT NULL DEFAULT '14:00:00',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본 설정 (전역)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT NOT NULL DEFAULT '행복낚시 출조 예약',
  bus_total_seats INTEGER NOT NULL DEFAULT 30,
  boat_total_spots INTEGER NOT NULL DEFAULT 20,
  bus_price INTEGER NOT NULL DEFAULT 50000,
  boat_price INTEGER NOT NULL DEFAULT 30000,
  departure_time TIME NOT NULL DEFAULT '05:00:00',
  return_time TIME NOT NULL DEFAULT '14:00:00',
  bank_name TEXT NOT NULL DEFAULT '신한은행',
  bank_account TEXT NOT NULL DEFAULT '110-412-245177',
  bank_holder TEXT NOT NULL DEFAULT '강현구',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본 사이트 설정 1행 삽입
INSERT INTO site_settings (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- ============================================
-- 2. 예약 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  bus_seat_number INTEGER,
  boat_spot_id TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('kakao', 'naver', 'bank', 'onsite')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'cancelled')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  depositor_name TEXT,
  pg_tid TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 예약 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- ============================================
-- 3. 상품 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 999,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);

-- ============================================
-- 4. 상품 주문 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS product_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_orders_booking_id ON product_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_product_id ON product_orders(product_id);

-- ============================================
-- 5. 좌석 차단 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS seat_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  seat_type TEXT NOT NULL CHECK (seat_type IN ('bus', 'boat')),
  seat_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seat_blocks_date ON seat_blocks(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seat_blocks_unique ON seat_blocks(date, seat_type, seat_id);

-- ============================================
-- 6. RLS 정책
-- ============================================

-- schedule_settings RLS
ALTER TABLE schedule_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule_settings_read_all" ON schedule_settings FOR SELECT USING (TRUE);
CREATE POLICY "schedule_settings_admin_all" ON schedule_settings FOR ALL USING (auth.role() = 'authenticated');

-- site_settings RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_read_all" ON site_settings FOR SELECT USING (TRUE);
CREATE POLICY "site_settings_admin_all" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- bookings RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_insert_anon" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (TRUE);
CREATE POLICY "bookings_update_admin" ON bookings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "bookings_delete_admin" ON bookings FOR DELETE USING (auth.role() = 'authenticated');

-- products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read_all" ON products FOR SELECT USING (TRUE);
CREATE POLICY "products_admin_all" ON products FOR ALL USING (auth.role() = 'authenticated');

-- product_orders RLS
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_orders_insert_anon" ON product_orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "product_orders_select_all" ON product_orders FOR SELECT USING (TRUE);
CREATE POLICY "product_orders_admin_all" ON product_orders FOR ALL USING (auth.role() = 'authenticated');

-- seat_blocks RLS
ALTER TABLE seat_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seat_blocks_read_all" ON seat_blocks FOR SELECT USING (TRUE);
CREATE POLICY "seat_blocks_admin_all" ON seat_blocks FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 7. 초기 상품 30개 INSERT
-- ============================================
INSERT INTO products (name, description, price, stock, is_active, sort_order) VALUES
  ('바다 낚시대 (3.6m)', '입문용 바다 낚시대, 카본 소재, 3.6m', 45000, 20, TRUE, 1),
  ('바다 낚시대 (4.5m)', '중급용 바다 낚시대, 고강도 카본', 65000, 15, TRUE, 2),
  ('전동 릴 (소형)', '바다 낚시용 소형 전동 릴 300W', 120000, 10, TRUE, 3),
  ('스피닝 릴 (2500번)', '범용 스피닝 릴, 볼베어링 8개', 55000, 20, TRUE, 4),
  ('원투 낚시 채비 세트', '원투 낚시 완성 채비 5세트', 8000, 100, TRUE, 5),
  ('선상 낚시 채비 세트', '선상 전용 채비 갈치/광어용 5세트', 10000, 100, TRUE, 6),
  ('갈치 채비 세트', '갈치 전용 야광 채비 5개입', 12000, 80, TRUE, 7),
  ('광어 채비 세트', '광어 지깅 채비 3개입', 15000, 80, TRUE, 8),
  ('참돔 채비 세트', '타이라바 참돔 채비 3개입', 18000, 60, TRUE, 9),
  ('민물 지렁이 (대)', '신선 민물 지렁이 대용량', 5000, 50, TRUE, 10),
  ('갯지렁이 (중)', '활갯지렁이 중용량', 6000, 50, TRUE, 11),
  ('크릴새우 (냉동)', '냉동 크릴새우 500g', 4000, 100, TRUE, 12),
  ('오징어 미끼 (냉동)', '냉동 오징어 미끼 300g', 3500, 80, TRUE, 13),
  ('집어등 (LED)', '수중 집어등 LED 그린라이트', 22000, 30, TRUE, 14),
  ('낚시 모자 (네이비)', '자외선 차단 낚시 전용 모자', 18000, 50, TRUE, 15),
  ('낚시 모자 (카키)', '자외선 차단 낚시 전용 모자 카키', 18000, 50, TRUE, 16),
  ('낚시 장갑 (논슬립)', '미끄럼 방지 낚시 장갑 L', 9000, 60, TRUE, 17),
  ('낚시 장갑 (방한)', '겨울용 방한 낚시 장갑', 15000, 40, TRUE, 18),
  ('편광 선글라스', 'UV400 편광 렌즈 낚시 선글라스', 28000, 30, TRUE, 19),
  ('아이스박스 (18L)', '보냉력 우수한 낚시 전용 아이스박스', 35000, 20, TRUE, 20),
  ('아이스박스 (30L)', '대용량 낚시 전용 아이스박스 30L', 52000, 15, TRUE, 21),
  ('낚시 가방 (배낭형)', '다용도 낚시 배낭 50L', 42000, 25, TRUE, 22),
  ('태클박스 (대)', '다단 수납 태클박스 대형', 25000, 30, TRUE, 23),
  ('낚시줄 PE 1호 150m', 'PE 합사 낚시줄 1호 150m', 18000, 50, TRUE, 24),
  ('낚시줄 PE 2호 150m', 'PE 합사 낚시줄 2호 150m', 20000, 50, TRUE, 25),
  ('야광 구슬 세트', '야광 구슬 채비용 혼합 50개입', 5000, 100, TRUE, 26),
  ('도래 세트', '스냅 도래 혼합 100개입', 4000, 100, TRUE, 27),
  ('봉돌 세트 (10호~30호)', '납 봉돌 혼합 세트 30개입', 7000, 80, TRUE, 28),
  ('바늘 세트 (갈치용)', '갈치 전용 바늘 혼합 30개입', 6000, 100, TRUE, 29),
  ('멀미약 (붙이는 패치)', '멀미 예방 귀 뒤 패치 3개입', 8000, 200, TRUE, 30),
  ('핸드워머 (일회용)', '일회용 핸드워머 10시간 지속 2개입', 3000, 200, TRUE, 31),
  ('낚시 우의 (상하의)', '방수 낚시 전용 우의 상하의 세트', 48000, 20, TRUE, 32),
  ('구명조끼 (자동팽창)', '해상 안전 자동팽창 구명조끼', 85000, 15, TRUE, 33),
  ('낚시 의자 (접이식)', '경량 접이식 낚시 의자', 32000, 20, TRUE, 34),
  ('집게 (스테인리스)', '스테인리스 바늘 제거 집게 20cm', 8000, 50, TRUE, 35);

-- ============================================
-- 8. 상품 단독 주문 테이블 (shop/page.tsx 용)
-- ============================================
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_product_id ON shop_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);

-- shop_orders RLS
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_orders_insert_auth" ON shop_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shop_orders_select_own" ON shop_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shop_orders_admin_all" ON shop_orders FOR ALL USING (auth.role() = 'authenticated');
