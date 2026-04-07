-- profiles 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- fishing_reports에 author_nickname 컬럼 추가
ALTER TABLE fishing_reports ADD COLUMN IF NOT EXISTS author_nickname TEXT;

-- notices에 author_nickname 컬럼 추가
ALTER TABLE notices ADD COLUMN IF NOT EXISTS author_nickname TEXT;
