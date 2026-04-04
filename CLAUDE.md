# 좋은피싱 프로젝트

Stack: Next.js14, Supabase(wcxdgviqlydscqnizgkp), Tailwind, Vercel
GitHub: https://github.com/a59103935-svg/fishing-reservation
URL: https://fishing-reservation.vercel.app

## DB
- bookings 컬럼: customer_name, customer_phone, customer_email, total_amount, deposit_name, reservation_date(NOT NULL 제거), payment_status
- payment_status: pending(입금대기), confirmed(예약확정), visit_pending(방문예정), cancelled(취소)

## 요금
- 버스 30석 70,000원
- 보트 16석 150,000원

## 계좌
신한은행 110-412-245177 예금주 강현구

## 미완료
1. 결제플로우: 무통장→예약완료+계좌안내 / 현장→방문예정등록+경고문구
2. bookings 컬럼 에러 수정 + reservation_date NOT NULL 제거
3. 모바일 UI 간격
4. 날씨API: OPENWEATHERMAP_API_KEY Vercel 환경변수 확인
