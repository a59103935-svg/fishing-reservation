export default function TermsPage() {
  return (
    <div className="max-w-sm mx-auto min-h-screen pb-28" style={{ background: '#0D1F35' }}>
      <div className="px-5 pt-10 pb-5">
        <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>LEGAL</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>이용약관</h1>
        <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>좋은피싱 서비스 이용약관</p>
      </div>

      <div className="px-4 space-y-3">

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제1조 (목적)</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            이 약관은 좋은피싱(이하 &quot;회사&quot;)이 제공하는 선상낚시 출조 예약 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차,
            회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제2조 (예약)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① 예약은 이용자가 출조 일정·좌석을 선택하고 요금을 납부함으로써 확정됩니다.</li>
            <li>② 예약 후 24시간 이내 입금이 확인되지 않을 경우 예약이 자동 취소될 수 있습니다.</li>
            <li>③ 버스 좌석 및 배 자리는 선착순으로 배정되며, 동일 좌석 중복 예약은 불가합니다.</li>
            <li>④ 미성년자의 경우 보호자 동의 후 예약이 가능합니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제3조 (결제)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① 결제 수단은 무통장입금, 카카오페이, 네이버페이, 현장결제 중 선택할 수 있습니다.</li>
            <li>② 무통장입금의 경우 입금자명을 예약자명과 동일하게 입력해야 합니다.</li>
            <li>③ PG 결제(카카오페이·네이버페이) 오류 발생 시 회사는 즉시 환불 처리합니다.</li>
            <li>④ 현장결제는 출조 당일 승선 전 납부를 원칙으로 합니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제4조 (취소 및 환불)</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            취소·환불에 관한 구체적인 사항은 별도의 환불정책을 따릅니다.
            기상 악화 등 불가항력으로 출조가 취소된 경우 전액 환불됩니다.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제5조 (이용자 의무)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① 이용자는 출발 30분 전까지 지정 집결지에 도착해야 합니다.</li>
            <li>② 음주 상태의 승선은 안전을 위해 금지됩니다.</li>
            <li>③ 구명조끼는 반드시 착용해야 합니다.</li>
            <li>④ 선장 및 스태프의 안전 지시에 따라야 합니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제6조 (책임의 한계)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① 천재지변, 기상 악화 등 불가항력으로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
            <li>② 이용자의 귀책 사유로 인한 손해에 대해 회사는 책임을 지지 않습니다.</li>
            <li>③ 개인 소지품 분실·파손에 대해 회사는 책임을 지지 않습니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제7조 (약관의 변경)</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.
          </p>
        </section>

        <p className="text-xs text-center pb-2" style={{ color: '#2D4060' }}>시행일: 2025년 1월 1일</p>
      </div>
    </div>
  )
}
