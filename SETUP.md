# 낚시 출조 예약 시스템 - 설정 가이드

## 1. 의존성 설치

```bash
cd fishing-reservation
npm install
```

## 2. Supabase 설정

1. [supabase.com](https://supabase.com) 접속 후 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_schema.sql` 전체 실행
3. Authentication > Users에서 관리자 계정 생성 (이메일/비밀번호)

## 3. 환경변수 설정

`.env.local.example` 을 `.env.local` 로 복사 후 값 입력:

```bash
cp .env.local.example .env.local
```

필수 값:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_BASE_URL` - 배포 URL (예: https://your-app.vercel.app)

카카오페이 (선택):
- `KAKAOPAY_CID` - 카카오페이 CID (테스트: TC0ONETIME)
- `KAKAOPAY_SECRET_KEY` - 카카오페이 시크릿 키

coolsms 알림톡 (선택):
- `COOLSMS_API_KEY`, `COOLSMS_API_SECRET`, `COOLSMS_SENDER_KEY`
- `KAKAO_TEMPLATE_BOOKING_CONFIRM` - 카카오 알림톡 템플릿 코드
- `FROM_PHONE` - 발신 전화번호

## 4. 개발 서버 실행

```bash
npm run dev
```

접속: http://localhost:3000

## 5. 관리자 접속

- URL: http://localhost:3000/admin
- Supabase에서 생성한 이메일/비밀번호로 로그인

## 6. Vercel 배포

```bash
npm install -g vercel
vercel
```

또는 GitHub에 Push 후 Vercel에서 Import

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 메인 달력 (예약 가능 날짜 조회) |
| `/booking/[date]` | 버스 좌석 선택 + 낚시용품 |
| `/booking/[date]/boat` | 배 자리 선택 |
| `/checkout` | 결제 (고객정보 + 결제수단) |
| `/confirmation/[id]` | 예약 완료 |
| `/admin` | 관리자 대시보드 |
| `/admin/reservations` | 예약 관리 |
| `/admin/products` | 낚시용품 관리 |
| `/admin/settings` | 출조 설정 + 휴무 달력 |

## 주요 기능

- 버스 30석 (7행×4석 + 뒷자리 2석)
- 배 20자리 (F1-5, L1-5, R1-5, B1-5)
- 결제: 카카오페이, 네이버페이, 무통장입금, 현장결제
- 카카오 알림톡 자동 발송
- 관리자: 예약 확인/취소, 좌석 차단, 상품 관리, 휴무 설정
