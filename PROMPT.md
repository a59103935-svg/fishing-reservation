# 낚시용품 주문내역 + 취소 기능 구현

## 구현할 것

### 1. /shop/orders 페이지 (주문내역 조회)
- 비로그인 유저도 접근 가능 (name + phone으로 조회)
- 이름 + 연락처 입력 → 해당 주문 목록 표시
- 주문 목록에 표시할 정보: 상품명, 수량, 금액, 주문일시, 상태(처리중/완료/취소)
- 각 주문 카드에 "취소 신청" 버튼 (status가 pending일 때만 표시)

### 2. 주문 취소 기능
- 취소 신청 버튼 클릭 → 확인 모달 ("정말 취소하시겠습니까?")
- 확인 시 shop_orders 테이블 status를 'cancelled'로 UPDATE
- name + phone이 일치하는 주문만 취소 가능

### 3. 주문 완료 페이지 연동
- /shop/complete 페이지 하단에 "주문내역 보기" 버튼 추가
- 클릭 시 /shop/orders로 이동

### 4. DB 작업
아래 SQL을 Supabase에서 먼저 실행:
```sql
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
```

### 5. UI 스타일
- 기존 앱 디자인 유지: 딥네이비 #0D1F35, 골드 #C9A84C, 흰색 #F8F9FA
- 모바일 최적화 (max-width 기준)
- 상태 뱃지: pending=처리중(노랑), completed=완료(초록), cancelled=취소(빨강)

## 프로젝트 경로
C:\Users\rnjsa\fishing-reservation
