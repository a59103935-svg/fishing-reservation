'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface FishingReport {
  id: string
  user_id: string
  author_name: string
  title: string
  content: string
  fish_type: string | null
  catch_date: string | null
  image_urls: string[]
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function FishingReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [report, setReport] = useState<FishingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    async function load() {
      const { data } = await supabase
        .from('fishing_reports')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) setReport(data)
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setDeleting(true)
    await supabase.from('fishing_reports').delete().eq('id', params.id)
    router.replace('/fishing-report')
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-24 px-4" style={{ background: '#0D1F35', paddingTop: '80px' }}>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-6" style={{ color: '#4A6888' }}>
        ← 목록으로
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="rounded-xl h-8 w-2/3 animate-pulse" style={{ background: '#1A3355' }} />
          <div className="rounded-xl h-4 w-1/4 animate-pulse" style={{ background: '#1A3355' }} />
          <div className="rounded-2xl h-48 animate-pulse" style={{ background: '#1A3355' }} />
        </div>
      ) : !report ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: '#4A6888' }}>게시글을 찾을 수 없습니다.</p>
        </div>
      ) : (
        <article>
          {/* 헤더 */}
          <div className="mb-6 pb-5" style={{ borderBottom: '1px solid rgba(45,95,153,0.4)' }}>
            {report.fish_type && (
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                {report.fish_type}
              </span>
            )}
            <h1 className="text-xl font-black mb-3" style={{ color: '#F8F9FA' }}>{report.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: '#93B5D4' }}>{report.author_name}</span>
                {report.catch_date && (
                  <span className="text-xs" style={{ color: '#4A6888' }}>출조일: {report.catch_date}</span>
                )}
              </div>
              <span className="text-xs" style={{ color: '#4A6888' }}>{formatDate(report.created_at)}</span>
            </div>
          </div>

          {/* 이미지 갤러리 */}
          {report.image_urls.length > 0 && (
            <div className="mb-5 grid gap-2" style={{ gridTemplateColumns: report.image_urls.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
              {report.image_urls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightbox(url)}
                  className="rounded-xl overflow-hidden"
                  style={{ aspectRatio: '4/3' }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* 본문 */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap mb-6" style={{ color: '#93B5D4' }}>
            {report.content}
          </div>

          {/* 삭제 버튼 (본인만) */}
          {user && user.id === report.user_id && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          )}
        </article>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  )
}
