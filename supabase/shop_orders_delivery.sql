-- shop_orders 테이블에 배송 관련 컬럼 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS delivery_type   text    NOT NULL DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
  ADD COLUMN IF NOT EXISTS address         text,
  ADD COLUMN IF NOT EXISTS delivery_fee    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method  text    NOT NULL DEFAULT 'bank'   CHECK (payment_method IN ('bank', 'onsite'));
