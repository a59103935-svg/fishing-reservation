'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Report {
  id: string
  date: string
  title: string
  author: string
  content: string
}

const FALLBACK_REPORTS: Report[] = [
  { id: '1', date: '2026.06.17', title: '좋은피싱 출조 중입니다', author: '선장', content: '출조 조황 정보가 곧 업데이트됩니다. 문의: 010-5910-3935' },
]

export default function CatchPage() {
  const [selected, setSelected] = useState<Report | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('fishing_reports')
      .select('id, title, author_name, catch_date, created_at, content')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setReports(
            data.map((r: any) => ({
              id: r.id,
              date: r.catch_date
                ? r.catch_date
                : new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, ''),
              title: r.title,
              author: r.author_name ?? '선장',
              content: r.content ?? '',
            }))
          )
        } else {
          setReports(FALLBACK_REPORTS)
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-16" style={{ background: '#0D1F35', paddingTop: '64px' }}>
      <div className="px-5 pt-8 pb-6">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>FISHING REPORT</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA', fontFamily: '"Noto Serif KR", Georgia, serif' }}>조황 게시판</h1>
        <p className="text-sm mt-1" style={{ color: '#4A6888' }}>최근 출조 조황 정보를 확인하세요</p>
      </div>
      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: '#1A3355', height: 80 }} />
          ))
        ) : (
          reports.map((report) => (
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
          ))
        )}
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
