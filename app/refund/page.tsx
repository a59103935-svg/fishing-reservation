export default function RefundPage() {
  return (
    <div className="max-w-sm mx-auto min-h-screen pb-28" style={{ background: '#0D1F35' }}>
      <div className="px-5 pt-10 pb-5">
        <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>LEGAL</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>환불 · 취소 정책</h1>
        <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>좋은피싱 예약 취소 및 환불 안내</p>
      </div>

      <div className="px-4 space-y-3">

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>환불 기준</p>
          <div className="space-y-3">

            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: '#86EFAC' }}>출조일 하루 전까지</p>
                <p className="text-xs" style={{ color: '#4A6888' }}>전날 자정 이전 취소 접수</p>
              </div>
              <p className="text-xl font-black" style={{ color: '#86EFAC' }}>100%</p>
            </div>

            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: '#C9A84C' }}>출조 당일 자정 이후</p>
                <p className="text-xs" style={{ color: '#4A6888' }}>출조 시작 전까지</p>
              </div>
              <p className="text-xl font-black" style={{ color: '#C9A84C' }}>50%</p>
            </div>

            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: '#FCA5A5' }}>출조 시작 후</p>
                <p className="text-xs" style={{ color: '#4A6888' }}>승선 이후</p>
              </div>
              <p className="text-xl font-black" style={{ color: '#FCA5A5' }}>불가</p>
            </div>

          </div>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>취소 방법</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>• 카카오채널 <span style={{ color: '#F8F9FA' }}>좋은피싱</span> 또는 전화(<span style={{ color: '#C9A84C' }}>010-5910-3935</span>)로 취소 요청</li>
            <li>• 예약자 성명, 예약 일정, 연락처를 함께 전달해 주세요</li>
            <li>• 환불은 취소 확인 후 <span style={{ color: '#C9A84C' }}>영업일 기준 3일 이내</span> 처리됩니다</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>예외 사항</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>• 기상 악화(태풍·강풍·폭우 등) 또는 선박 결함으로 출조 취소 시 <span style={{ color: '#86EFAC' }}>전액 환불</span></li>
            <li>• 음주 상태 승선 거부 시 환불 불가</li>
            <li>• 개인 사정 노쇼(No-show)는 환불 불가</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>유의사항</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#4A6888' }}>
            <li>• 환불 기준 시각은 서버 수신 시간을 기준으로 합니다</li>
            <li>• 부분 예약(버스+배 자리)의 경우 각 항목별로 환불 정책이 적용됩니다</li>
          </ul>
        </section>

      </div>
    </div>
  )
}
