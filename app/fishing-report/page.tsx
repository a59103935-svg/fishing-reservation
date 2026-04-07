'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface FishingReport {
  id: string
  author_name: string
  title: string
  fish_type: string | null
  catch_date: string | null
  created_at: string
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

export default function FishingReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<FishingReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    async function load() {
      const { data } = await supabase
        .from('fishing_reports')
        .select('id, author_name, title, fish_type, catch_date, created_at')
        .order('created_at', { ascending: false })
      if (data) setReports(data)
      setLoading(false)
    }
    load()
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-24 px-4" style={{ background: '#0D1F35', paddingTop: '80px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>FISHING REPORT</p>
          <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>조황게시판</h1>
        </div>
        {user && (
          <button
            onClick={() => router.push('/fishing-report/write')}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: '#C9A84C', color: '#0D1F35' }}
          >
            글쓰기
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#1A3355' }} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🎣</p>
          <p className="text-sm" style={{ color: '#4A6888' }}>첫 조황을 올려주세요!</p>
          {!user && (
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              로그인하고 글쓰기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => router.push(`/fishing-report/${report.id}`)}
              className="w-full text-left rounded-2xl px-5 py-4 transition-all active:scale-[0.99]"
              style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                {report.fish_type && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                    {report.fish_type}
                  </span>
                )}
                <p className="text-sm font-semibold line-clamp-1" style={{ color: '#F8F9FA' }}>{report.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold" style={{ color: '#4A6888' }}>{report.author_name}</span>
                {report.catch_date && (
                  <span className="text-xs" style={{ color: '#2D4A66' }}>{report.catch_date}</span>
                )}
                <span className="text-xs ml-auto" style={{ color: '#2D4A66' }}>{timeAgo(report.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!user && reports.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            로그인하고 글쓰기
          </button>
        </div>
      )}
    </div>
  )
}
