-- 카테고리 체계 변경:
-- 기존: rod / rig / bait / gear
-- 신규: rig(채비류) / bait(미끼류) / gear(장비류) / clothing(의류잡화) / etc(기타)

-- 'rod'를 'gear(장비류)'로 통합
UPDATE products SET category = 'gear' WHERE category = 'rod';

-- category 컬럼 기본값도 'gear'로 통일
ALTER TABLE products ALTER COLUMN category SET DEFAULT 'gear';
