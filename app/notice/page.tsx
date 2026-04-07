'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notice {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function NoticePage() {
  const router = useRouter()
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (data) setNotices(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-24 px-4" style={{ background: '#0D1F35', paddingTop: '80px' }}>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>NOTICE</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>공지사항</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: '#1A3355' }} />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: '#4A6888' }}>등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map((notice) => (
            <button
              key={notice.id}
              onClick={() => router.push(`/notice/${notice.id}`)}
              className="w-full text-left rounded-2xl px-5 py-4 transition-all active:scale-[0.99]"
              style={{ background: '#1A3355', border: `1px solid ${notice.is_pinned ? 'rgba(201,168,76,0.4)' : 'rgba(45,95,153,0.4)'}` }}
            >
              <div className="flex items-center gap-2 mb-1">
                {notice.is_pinned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                    공지
                  </span>
                )}
                <p className="text-sm font-semibold line-clamp-1" style={{ color: '#F8F9FA' }}>{notice.title}</p>
              </div>
              <p className="text-xs" style={{ color: '#4A6888' }}>{formatDate(notice.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
