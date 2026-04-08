# 관리자 설정 페이지 버그 수정

## 작업 1: 저장 버그 수정
파일: app/admin/settings/page.tsx

저장 버튼 누르면 "[object Object]" 에러 발생. 원인 찾아서 수정:

1. upsert 에러를 console.log로 전체 출력하도록 먼저 수정
2. onConflict 옵션 확인 — 올바른 형태:
   supabase.from('site_settings').upsert({ key: 'bus_price', value: String(value) }, { onConflict: 'key' })
3. RLS 문제일 경우 Supabase SQL에서 실행:
   CREATE POLICY "allow all" ON site_settings FOR ALL USING (true) WITH CHECK (true);
4. service role key 사용이 필요하면 lib/supabaseAdmin.ts 생성 후 사용

## 작업 2: 라벨 골드색 변경
settings 페이지 내 모든 입력 필드 라벨 텍스트를 #C9A84C 골드색으로 변경.
대상: 버스 총 좌석 수, 배 총 자리 수, 버스요금(원), 배삯(원), 출발 시간, 귀항 시간, 은행명, 계좌번호, 예금주 등

## 완료 후
git add -A && git commit -m "fix: 설정 저장 버그 수정 + 라벨 골드색" && git push
