# 미완료 작업 처리 + 날씨/물때 개선

## 1. 결제 플로우 수정
- 무통장입금 → 예약완료 페이지 + 계좌 안내 (신한은행 110-412-245177 예금주 강현구)
- 현장결제 → "방문예정 등록 완료" 페이지 + 경고문구 골드색
- 경고문구: "현장결제는 자리를 보장하지 않습니다. 선착순 배정이며, 조기 마감 시 탑승이 어려울 수 있습니다."

## 2. bookings 컬럼 에러 수정
- reservation_date NOT NULL 제약조건 제거
- total_amount 컬럼 없으면 추가
- customer_name, customer_phone, customer_email, deposit_name 컬럼 없으면 추가
- NOTIFY pgrst, 'reload schema' 실행

## 3. 모바일 UI 간격
- 물때/날씨 섹션과 히어로 텍스트 사이 간격 모바일에서 자연스럽게 조정

## 4. 날씨 API 환경변수 확인
- Vercel 환경변수에 NEXT_PUBLIC_WEATHER_API_KEY 등록됐는지 확인
- 없으면 vercel.json 또는 코드에 추가

## 5. 날씨/물때 날짜 선택 기능 추가
- 홈 화면 날씨/물때 섹션에 날짜 선택 탭 추가
- 오늘 / 내일 / 모레 / 3일 후 총 4개 탭
- 탭 선택 시 해당 날짜의 날씨와 물때 정보 표시
- OpenWeatherMap API forecast 엔드포인트 사용 (5일 예보)
- 물때는 날짜별로 계산해서 표시

## 6. 완료 후 git push
