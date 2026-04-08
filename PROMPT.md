# 작업 지시

다음 기능을 순서대로 구현해줘.

## 1. 닉네임 설정 기능

### DB
- public.profiles 테이블이 없으면 생성:
  - id (uuid, FK → auth.users.id)
  - nickname (text, unique)
  - created_at (timestamptz)
- RLS: 본인만 insert/update, 전체 select 가능

### 닉네임 설정 페이지 (app/set-nickname/page.tsx)
- 닉네임 입력 폼 (2~10자, 한글/영문/숫자)
- 중복 확인 버튼 (profiles 테이블에서 unique 체크)
- 저장 시 profiles에 upsert → 메인(/)으로 리다이렉트

### 로그인 후 닉네임 체크 로직
- app/auth/kakao-callback/page.tsx, app/auth/naver-callback/page.tsx (있다면)
- 로그인 성공 후 profiles 테이블에 해당 user id 있는지 확인
- 없으면 → /set-nickname 으로 리다이렉트
- 있으면 → / 으로 리다이렉트

## 2. 게시판 글쓸 때 닉네임 자동입력
- 공지사항 작성 / 조황게시판 작성 페이지에서
- 현재 로그인 유저의 profiles.nickname 불러와서 작성자 필드에 자동 세팅 (readonly)
- notices, fishing_reports 테이블에 author_nickname 컬럼 없으면 추가

## 3. 조황게시판 사진 5장 업로드
- app/fishing-report/write 페이지 (없으면 생성)
- 이미지 최대 5장 선택 (미리보기 포함)
- Supabase Storage fishing-reports 버킷에 업로드
- fishing_reports 테이블에 image_urls (text[]) 컬럼 없으면 추가
- 업로드 후 URL 배열로 저장

순서대로 진행하고 각 단계 완료시 알려줘.
