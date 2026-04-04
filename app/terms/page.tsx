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
            이 약관은 좋은피싱(이하 "회사")이 제공하는 선상낚시 출조 예약 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제2조 (용어의 정의)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① "서비스"란 회사가 제공하는 출조 예약, 좌석 선택, 결제 등 일체의 온라인 서비스를 말합니다.</li>
            <li>② "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
            <li>③ "예약"이란 이용자가 출조 일정을 선택하고 요금을 납부하여 자리를 확정하는 행위를 말합니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제3조 (서비스 이용)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① 서비스 이용은 예약 신청 후 회사의 입금 확인 완료 시점에 성립됩니다.</li>
            <li>② 이용자는 예약 확정 후 출조 30분 전까지 지정 집결지에 도착해야 합니다.</li>
            <li>③ 기상 악화 등 불가항력적 사유로 출조가 취소될 경우 전액 환불됩니다.</li>
            <li>④ 음주 상태의 승선은 안전을 위해 금지되며, 이 경우 환불이 불가합니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제4조 (취소 및 환불)</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            취소 및 환불에 관한 사항은 별도의 환불정책을 따릅니다. 환불정책 페이지를 참고해 주세요.
          </p>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제5조 (책임의 한계)</p>
          <ul className="space-y-2 text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            <li>① 회사는 천재지변, 기상 악화 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>② 이용자의 귀책 사유로 인한 손해에 대해 회사는 책임을 지지 않습니다.</li>
            <li>③ 이용자는 낚시 활동 중 발생하는 사고에 대해 개인 안전을 스스로 책임져야 합니다.</li>
          </ul>
        </section>

        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>제6조 (약관의 변경)</p>
          <p className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>
            회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.
          </p>
        </section>

        <p className="text-xs text-center pb-2" style={{ color: '#2D4060' }}>시행일: 2025년 1월 1일</p>
      </div>
    </div>
  )
}
