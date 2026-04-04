'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CatchReport {
  id: string
  author_name: string
  title: string
  content: string | null
  fish_type: string | null
  image_url: string | null
  likes: number
  created_at: string
}

const FISH_TYPES = ['전체', '광어', '우럭', '참돔', '방어', '고등어', '갈치', '쭈꾸미', '기타']

export default function CatchPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<CatchReport[]>([])
  const [loading, setLoading] = useState(true)
  const [fishFilter, setFishFilter] = useState('전체')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ author_name: '', title: '', content: '', fish_type: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadReports() }, [])

  async function loadReports() {
    setLoading(true)
    const { data } = await supabase.from('catch_reports').select('*').order('created_at', { ascending: false })
    if (data) setReports(data)
    setLoading(false)
  }

  const filtered = fishFilter === '전체' ? reports : reports.filter(r => r.fish_type === fishFilter)

  async function submitReport() {
    if (!form.author_name.trim() || !form.title.trim()) { alert('닉네임과 제목을 입력해주세요.'); return }
    setSubmitting(true)
    const { error } = await supabase.from('catch_reports').insert({ author_name: form.author_name.trim(), title: form.title.trim(), content: form.content.trim() || null, fish_type: form.fish_type || null })
    if (error) { alert('오류가 발생했습니다.'); setSubmitting(false); return }
    setForm({ author_name: '', title: '', content: '', fish_type: '' })
    setShowForm(false)
    loadReports()
    setSubmitting(false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return '방금 전'
    if (m < 60) return `${m}분 전`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}시간 전`
    return `${Math.floor(h / 24)}일 전`
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-24" style={{ background: '#0D1F35' }}>
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>GOOD FISHING</p>
          <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>조황 게시판</h1>
          <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>조과 자랑 & 정보 공유</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: '#C9A84C', color: '#0D1F35' }}>글쓰기</button>
      </div>
      <div className="sticky top-0 z-20 px-0 pb-3 pt-1" style={{ background: '#0D1F35' }}>
        <div className="flex overflow-x-auto scrollbar-none px-4 gap-2">
          {FISH_TYPES.map(f => (
            <button key={f} onClick={() => setFishFilter(f)} className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all" style={{ background: fishFilter === f ? '#C9A84C' : 'rgba(30,63,102,0.6)', color: fishFilter === f ? '#0D1F35' : '#4A6888', border: fishFilter === f ? 'none' : '1px solid rgba(45,95,153,0.3)' }}>{f}</button>
          ))}
        </div>
      </div>
      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#1E3F66' }} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-4xl mb-3">🎣</p><p className="text-sm" style={{ color: '#4A6888' }}>첫 조황을 올려주세요!</p></div>
        ) : filtered.map(report => (
          <div key={report.id} className="rounded-2xl p-4" style={{ background: '#1E3F66', border: '1px solid rgba(45,95,153,0.4)' }}>
            <div className="flex items-start gap-2 mb-2">
              {report.fish_type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>{report.fish_type}</span>}
              <p className="text-sm font-bold leading-snug" style={{ color: '#F8F9FA' }}>{report.title}</p>
            </div>
            {report.content && <p className="text-xs mb-3 line-clamp-2" style={{ color: '#93B5D4' }}>{report.content}</p>}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: '#4A6888' }}>{report.author_name}</span>
              <span className="text-xs" style={{ color: '#2D4A66' }}>{timeAgo(report.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0" style={{ background: 'rgba(8,22,40,0.85)' }} onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm mx-auto rounded-t-3xl px-5 pt-5 pb-8" style={{ background: '#0F1E30', border: '1px solid rgba(45,95,153,0.5)', borderBottom: 'none' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(45,95,153,0.5)' }} />
            <h2 className="text-base font-bold mb-4" style={{ color: '#F8F9FA' }}>조황 올리기</h2>
            <div className="space-y-3 mb-5">
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#4A6888' }}>닉네임</label><input type="text" placeholder="낚시왕홍길동" value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} className="form-input" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#4A6888' }}>어종</label><select value={form.fish_type} onChange={e => setForm(p => ({ ...p, fish_type: e.target.value }))} className="form-input"><option value="">선택안함</option>{FISH_TYPES.filter(f => f !== '전체').map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#4A6888' }}>제목</label><input type="text" placeholder="오늘 광어 대박났어요!" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#4A6888' }}>내용 (선택)</label><textarea placeholder="조황 내용을 자유롭게 올려주세요" rows={3} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="form-input resize-none" /></div>
            </div>
            <button onClick={submitReport} disabled={submitting} className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50" style={{ background: '#C9A84C', color: '#0D1F35' }}>{submitting ? '등록 중...' : '등록하기'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
