'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notice {
  id: number
  date: string
  title: string
  content: string
}

// DB에 공지사항 테이블이 없거나 비어있을 때 표시할 기본값
const FALLBACK_NOTICES: Notice[] = [
  { id: 1, date: '2026.06.17', title: '좋은피싱에 오신 것을 환영합니다', content: '경남 최고의 선상낚시 좋은피싱입니다. 출조 예약 및 문의는 010-5910-3935로 연락 주세요.' },
]

export default function NoticesPage() {
  const [selected, setSelected] = useState<Notice | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notices')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setNotices(
            data.map((n: any) => ({
              id: n.id,
              date: new Date(n.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '').replace(/\.$/, ''),
              title: n.title,
              content: n.content,
            }))
          )
        } else {
          setNotices(FALLBACK_NOTICES)
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-16" style={{ background: '#0D1F35', paddingTop: '64px' }}>
      <div className="px-5 pt-8 pb-6">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>NOTICE</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA', fontFamily: '"Noto Serif KR", Georgia, serif' }}>공지사항</h1>
        <p className="text-sm mt-1" style={{ color: '#4A6888' }}>좋은피싱 최신 공지사항을 확인하세요</p>
      </div>
      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: '#1A3355', height: 72 }} />
          ))
        ) : (
          notices.map((notice) => (
            <button key={notice.id} onClick={() => setSelected(notice)} className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.35)' }} onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid rgba(45,95,153,0.35)')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-snug" style={{ color: '#F8F9FA' }}>{notice.title}</p>
                  <p className="text-xs mt-1.5" style={{ color: '#4A6888' }}>{notice.date}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#C9A84C' }} />
              </div>
            </button>
          ))
        )}
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
