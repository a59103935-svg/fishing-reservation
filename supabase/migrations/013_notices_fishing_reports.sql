-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 조황게시판 테이블
CREATE TABLE IF NOT EXISTS fishing_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  fish_type TEXT,
  catch_date DATE,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_reports ENABLE ROW LEVEL SECURITY;

-- notices: 모든 유저 읽기 가능, 관리자만 쓰기 (일단 authenticated도 허용)
CREATE POLICY "notices_read" ON notices FOR SELECT USING (true);
CREATE POLICY "notices_write" ON notices FOR ALL USING (auth.role() = 'authenticated');

-- fishing_reports: 모든 유저 읽기, 로그인 유저 작성, 본인만 수정/삭제
CREATE POLICY "reports_read" ON fishing_reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON fishing_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update" ON fishing_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reports_delete" ON fishing_reports FOR DELETE USING (auth.uid() = user_id);
