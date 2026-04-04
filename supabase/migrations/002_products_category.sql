-- ============================================
-- products 테이블에 category 컬럼 추가
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'gear';

-- 기존 상품 카테고리 분류
UPDATE products SET category = 'rod'  WHERE name ILIKE '%낚시대%' OR name ILIKE '%릴%';
UPDATE products SET category = 'rig'  WHERE name ILIKE '%채비%' OR name ILIKE '%바늘%' OR name ILIKE '%도래%' OR name ILIKE '%봉돌%' OR name ILIKE '%야광%';
UPDATE products SET category = 'bait' WHERE name ILIKE '%지렁이%' OR name ILIKE '%크릴%' OR name ILIKE '%오징어%' OR name ILIKE '%미끼%';
-- 나머지는 기본값 'gear' 유지

-- ============================================
-- shop_orders 테이블 비회원 지원으로 변경
-- ============================================
ALTER TABLE shop_orders
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS name  TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- RLS 정책 교체: 비회원 insert 허용
DROP POLICY IF EXISTS "shop_orders_insert_auth"   ON shop_orders;
DROP POLICY IF EXISTS "shop_orders_select_own"    ON shop_orders;

CREATE POLICY "shop_orders_insert_anon" ON shop_orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "shop_orders_select_all"  ON shop_orders FOR SELECT USING (TRUE);
