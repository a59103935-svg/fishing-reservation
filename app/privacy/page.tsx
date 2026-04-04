export default function PrivacyPage() {
  return (
    <div className="max-w-sm mx-auto min-h-screen pb-28" style={{ background: '#0D1F35' }}>
      <div className="px-5 pt-10 pb-5">
        <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>LEGAL</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>개인정보처리방침</h1>
        <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>좋은피싱 개인정보 처리 안내</p>
      </div>

      <div className="px-4 space-y-3">

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>1. 수집하는 개인정보 항목</p>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>• 성명, 연락처(휴대폰 번호)</li>
            <li>• 예약 정보(출조 일정, 좌석 정보)</li>
            <li>• 결제 정보(입금자명, 입금 금액)</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>2. 개인정보 수집·이용 목적</p>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>• 출조 예약 접수 및 확인</li>
            <li>• 예약 관련 안내 및 알림 발송</li>
            <li>• 입금 확인 및 정산</li>
            <li>• 취소·환불 처리</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>3. 개인정보 보유·이용 기간</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            출조 완료일로부터 <span style={{ color: '#C9A84C' }}>1년간</span> 보관 후 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>4. 개인정보의 제3자 제공</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의거하거나 이용자의 동의가 있는 경우 예외로 합니다.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>5. 개인정보 파기 절차 및 방법</p>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>• 전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
            <li>• 종이 문서: 분쇄 또는 소각</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>6. 이용자의 권리</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            이용자는 언제든지 자신의 개인정보 조회, 수정, 삭제를 요청할 수 있습니다. 요청은 카카오채널 또는 전화 문의를 통해 접수 가능합니다.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>7. 개인정보 보호책임자</p>
          <div className="text-xs space-y-1" style={{ color: '#93B5D4' }}>
            <p>담당자: 강현구</p>
            <p>상호: 좋은피싱</p>
            <p>문의: 카카오채널 좋은피싱</p>
          </div>
        </section>

        <p className="text-xs text-center pb-2" style={{ color: '#2D4060' }}>시행일: 2025년 1월 1일</p>
      </div>
    </div>
  )
}
