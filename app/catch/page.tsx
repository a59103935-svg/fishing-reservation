'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface CatchReport {
  id: string
  author_name: string
  title: string
  content: string | null
  created_at: string
}

export default function CatchPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<CatchReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    async function load() {
      const { data } = await supabase
        .from('catch_reports')
        .select('id, author_name, title, content, created_at')
        .order('created_at', { ascending: false })
      if (data) setReports(data)
      setLoading(false)
    }
    load()
    return () => subscription.unsubscribe()
  }, [])

  function handleWriteClick() {
    if (!user) { router.push('/login'); return }
    router.push('/catch/write')
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
    <div className="max-w-2xl mx-auto min-h-screen pb-24 px-4" style={{ background: '#0D1F35', paddingTop: '88px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>GOOD FISHING</p>
          <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>조황 게시판</h1>
          <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>조과 자랑 & 정보 공유</p>
        </div>
        <button
          onClick={handleWriteClick}
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: '#C9A84C', color: '#0D1F35' }}
        >
          글쓰기
        </button>
      </div>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#1A3355' }} />
          ))
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🎣</p>
            <p className="text-sm" style={{ color: '#4A6888' }}>첫 조황을 올려주세요!</p>
          </div>
        ) : reports.map(report => (
          <div key={report.id} className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
            <p className="text-sm font-bold leading-snug mb-2" style={{ color: '#F8F9FA' }}>{report.title}</p>
            {report.content && <p className="text-xs mb-3 line-clamp-2" style={{ color: '#93B5D4' }}>{report.content}</p>}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: '#4A6888' }}>{report.author_name}</span>
              <span className="text-xs" style={{ color: '#2D4A66' }}>{timeAgo(report.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
