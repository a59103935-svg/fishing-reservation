'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notice {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function NoticeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) setNotice(data)
      setLoading(false)
    }
    load()
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-24 px-4" style={{ background: '#0D1F35', paddingTop: '80px' }}>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: '#4A6888' }}
      >
        ← 목록으로
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="rounded-xl h-8 w-2/3 animate-pulse" style={{ background: '#1A3355' }} />
          <div className="rounded-xl h-4 w-1/4 animate-pulse" style={{ background: '#1A3355' }} />
          <div className="rounded-2xl h-48 animate-pulse" style={{ background: '#1A3355' }} />
        </div>
      ) : !notice ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: '#4A6888' }}>공지사항을 찾을 수 없습니다.</p>
        </div>
      ) : (
        <article>
          <div className="mb-6 pb-6" style={{ borderBottom: '1px solid rgba(45,95,153,0.4)' }}>
            <div className="flex items-center gap-2 mb-3">
              {notice.is_pinned && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                  공지
                </span>
              )}
            </div>
            <h1 className="text-xl font-black mb-2" style={{ color: '#F8F9FA' }}>{notice.title}</h1>
            <p className="text-xs" style={{ color: '#4A6888' }}>{formatDate(notice.created_at)}</p>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#93B5D4' }}>
            {notice.content}
          </div>
        </article>
      )}
    </div>
  )
}
