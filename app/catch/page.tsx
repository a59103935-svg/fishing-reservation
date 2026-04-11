'use client'

import { useState } from 'react'

const REPORTS = [
  { id: 1, date: '2025.12.01', title: '갈치 대조황 — 1인당 30마리 이상', author: '선장', content: '오늘 날씨도 좋고 조황도 최상이었습니다. 갈치가 잘 올라왔으며 1인당 30마리 이상 조과를 기록했습니다.' },
  { id: 2, date: '2025.11.29', title: '광어·우럭 풍성 — 날씨 최상', author: '선장', content: '광어와 우럭이 풍성하게 잡혔습니다. 날씨도 맑고 파도도 잔잔해 최상의 낚시 환경이었습니다.' },
  { id: 3, date: '2025.11.25', title: '참돔 시즌 본격 시작', author: '선장', content: '참돔 시즌이 본격적으로 시작됐습니다. 올해 참돔 조황이 예년보다 풍성할 것으로 예상됩니다.' },
  { id: 4, date: '2025.11.20', title: '갈치 + 삼치 혼획', author: '선장', content: '갈치와 삼치가 함께 잡히는 최상의 조황을 보였습니다. 모든 분들이 풍성한 손맛을 즐기셨습니다.' },
  { id: 5, date: '2025.11.15', title: '우럭 마릿수 조황', author: '선장', content: '우럭이 마릿수로 잡혔습니다. 초보자분들도 쉽게 입질을 받으실 수 있는 날이었습니다.' },
]

export default function CatchPage() {
  const [selected, setSelected] = useState<typeof REPORTS[0] | null>(null)

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-16" style={{ background: '#0D1F35', paddingTop: '64px' }}>
      <div className="px-5 pt-8 pb-6">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>FISHING REPORT</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA', fontFamily: '"Noto Serif KR", Georgia, serif' }}>조황 게시판</h1>
        <p className="text-sm mt-1" style={{ color: '#4A6888' }}>최근 출조 조황 정보를 확인하세요</p>
      </div>
      <div className="px-4 space-y-3">
        {REPORTS.map((report) => (
          <button key={report.id} onClick={() => setSelected(report)} className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.35)' }} onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid rgba(45,95,153,0.35)')}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug" style={{ color: '#F8F9FA' }}>{report.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs" style={{ color: '#4A6888' }}>{report.date}</span>
                  <span className="text-xs" style={{ color: '#4A6888' }}>·</span>
                  <span className="text-xs" style={{ color: '#C9A84C' }}>{report.author}</span>
                </div>
              </div>
              <span className="text-lg flex-shrink-0">🎣</span>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
          <div className="absolute inset-0" style={{ background: 'rgba(8,22,40,0.85)' }} onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.5)' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#C9A84C' }}>{selected.date} · {selected.author}</p>
                <h2 className="font-black text-base leading-snug" style={{ color: '#F8F9FA' }}>{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,95,153,0.4)', color: '#93B5D4' }}>✕</button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#93B5D4' }}>{selected.content}</p>
            <button onClick={() => setSelected(null)} className="mt-5 w-full py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(45,95,153,0.3)', color: '#F8F9FA' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
