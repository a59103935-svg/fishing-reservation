# 소셜 로그인 + 전화번호 인증 구현

## 목적
조황 게시판 글 작성 시 로그인 필요. 로그인 방식 3가지 구현.

## 1. Supabase Auth 설정 확인
- Supabase 프로젝트: wcxdgviqlydscqnizgkp
- 카카오 Provider 이미 Enabled 완료
- Redirect URL: https://fishing-reservation.vercel.app/auth/callback

## 2. 로그인 페이지 생성 (/app/login/page.tsx)
- 카카오 로그인 버튼 (노란색, 카카오 브랜드 색상)
- 네이버 로그인 버튼 (초록색, 네이버 브랜드 색상)
- 구분선 "또는"
- 전화번호 입력 + SMS 인증 방식
  - 전화번호 입력 → "인증번호 받기" 버튼
  - 6자리 인증번호 입력란
  - Supabase Phone Auth OTP 사용
- 전체 디자인은 기존 앱 다크 테마 유지

## 3. Auth Callback 페이지 생성 (/app/auth/callback/route.ts)
- 소셜 로그인 후 리다이렉트 처리
- 로그인 성공 시 이전 페이지 또는 홈으로 이동

## 4. 카카오 로그인 구현
- supabase.auth.signInWithOAuth({ provider: 'kakao' })
- redirectTo: https://fishing-reservation.vercel.app/auth/callback
- Vercel 환경변수 추가 필요:
  NEXT_PUBLIC_SUPABASE_URL (이미 있음)
  NEXT_PUBLIC_SUPABASE_ANON_KEY (이미 있음)

## 5. 네이버 로그인 구현
- Supabase에 네이버 Provider 없음 → Custom OAuth로 구현
- 또는 일단 "준비중" 표시하고 카카오만 먼저 구현

## 6. 전화번호 SMS 인증
- Supabase Phone Auth 사용
- supabase.auth.signInWithOtp({ phone: '+821012345678' })
- 한국 번호 형식: 010-xxxx-xxxx → +8210xxxxxxxx 변환
- 인증번호 확인: supabase.auth.verifyOtp({ phone, token, type: 'sms' })

## 7. 로그인 상태 관리
- Supabase session 전역 관리
- 로그인 후 헤더에 사용자 표시
- 로그아웃 기능

## 8. 조황 게시판 글쓰기 권한
- 로그인한 사용자만 글 작성 가능
- 비로그인 시 "글쓰기" 버튼 클릭하면 /login으로 이동

## 9. 완료 후 git push
