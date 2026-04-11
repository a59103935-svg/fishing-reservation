'use client'

import { useState } from 'react'

const NOTICES = [
  { id: 1, date: '2025.12.01', title: '12월 출조 일정 안내', content: '12월 출조 일정을 안내드립니다. 매주 토·일요일 정기 출조가 진행되며, 평일 출조는 10인 이상 예약 시 가능합니다.' },
  { id: 2, date: '2025.11.28', title: '겨울 방한복 무료 대여 이벤트', content: '겨울철 출조 시 방한복을 무료로 대여해 드립니다. 예약 시 방한복 사이즈를 미리 알려주시면 준비해 드리겠습니다.' },
  { id: 3, date: '2025.11.20', title: '연말 단체 예약 특가 안내', content: '연말을 맞아 단체 예약 특가를 진행합니다. 20인 이상 예약 시 10% 할인 혜택을 드립니다.' },
  { id: 4, date: '2025.11.10', title: '선상 낚시 안전 수칙 안내', content: '안전한 낚시를 위해 반드시 구명조끼를 착용해 주세요. 음주 후 낚시는 금지되어 있습니다.' },
]

export default function NoticesPage() {
  const [selected, setSelected] = useState<typeof NOTICES[0] | null>(null)

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-16" style={{ background: '#0D1F35', paddingTop: '64px' }}>
      <div className="px-5 pt-8 pb-6">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>NOTICE</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA', fontFamily: '"Noto Serif KR", Georgia, serif' }}>공지사항</h1>
        <p className="text-sm mt-1" style={{ color: '#4A6888' }}>좋은피싱 최신 공지사항을 확인하세요</p>
      </div>
      <div className="px-4 space-y-3">
        {NOTICES.map((notice) => (
          <button key={notice.id} onClick={() => setSelected(notice)} className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.35)' }} onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid rgba(45,95,153,0.35)')}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug" style={{ color: '#F8F9FA' }}>{notice.title}</p>
                <p className="text-xs mt-1.5" style={{ color: '#4A6888' }}>{notice.date}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#C9A84C' }} />
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
                <p className="text-xs mb-1" style={{ color: '#C9A84C' }}>{selected.date}</p>
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
