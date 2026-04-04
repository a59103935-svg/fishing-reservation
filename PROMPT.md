# 현장결제 플로우 수정 + DB 에러 수정

## 1. bookings 테이블 컬럼 에러 수정
- reservation_date NOT NULL 제약조건 제거
- total_amount 컬럼 없으면 추가
- customer_name, customer_phone, customer_email, deposit_name 컬럼 없으면 추가
- Supabase SQL: NOTIFY pgrst, 'reload schema' 실행

## 2. 현장결제 → "방문예정 등록"으로 변경
- DB insert 시 payment_status = 'visit_pending'으로 저장

## 3. 예약 완료 페이지 분기
- 무통장: 기존 "예약 완료" + 계좌 안내 (신한은행 110-412-245177 예금주 강현구)
- 현장결제: "방문예정 등록 완료" + 경고 문구 표시
  - 문구: "현장결제는 자리를 보장하지 않습니다. 선착순 배정이며, 조기 마감 시 탑승이 어려울 수 있습니다."
  - 골드 색상으로 강조

## 4. 어드민 예약 목록 배지 구분
- visit_pending → "방문예정" 노란색 배지
- pending → "입금대기" 파란색 배지
- confirmed → "예약확정" 초록색 배지
- cancelled → "취소" 빨간색 배지

## 5. 완료 후 git push
