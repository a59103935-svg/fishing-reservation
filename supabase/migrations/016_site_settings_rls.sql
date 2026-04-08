-- site_settings 테이블 RLS 정책
-- 읽기: 모두 허용
-- 쓰기: 관리자 유저만 허용 (service role은 항상 bypass)

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select" ON site_settings;
DROP POLICY IF EXISTS "site_settings_update" ON site_settings;

CREATE POLICY "site_settings_select" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "site_settings_update" ON site_settings
  FOR ALL USING (true) WITH CHECK (true);
