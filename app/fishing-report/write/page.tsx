'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const FISH_TYPES = ['광어', '우럭', '참돔', '방어', '고등어', '갈치', '쭈꾸미', '기타']

export default function FishingReportWritePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState('')
  const [form, setForm] = useState({ title: '', content: '', fish_type: '', catch_date: '' })
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUser(data.user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profile?.nickname) {
        setNickname(profile.nickname)
      } else {
        router.replace('/set-nickname')
      }
    })
  }, [])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - images.length)
    setImages(prev => [...prev, ...files])
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviews(prev => [...prev, url])
    })
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }
    if (!user) return
    setSubmitting(true)
    setError('')

    // 이미지 업로드
    const imageUrls: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('fishing-reports')
        .upload(path, file)
      if (!uploadError) {
        const { data } = supabase.storage.from('fishing-reports').getPublicUrl(path)
        imageUrls.push(data.publicUrl)
      }
    }

    const { error: insertError } = await supabase.from('fishing_reports').insert({
      user_id: user.id,
      author_name: nickname,
      author_nickname: nickname,
      title: form.title.trim(),
      content: form.content.trim(),
      fish_type: form.fish_type || null,
      catch_date: form.catch_date || null,
      image_urls: imageUrls,
    })

    if (insertError) {
      setError('등록 중 오류가 발생했습니다.')
      setSubmitting(false)
      return
    }

    router.replace('/fishing-report')
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-24 px-4" style={{ background: '#0D1F35', paddingTop: '80px' }}>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-6" style={{ color: '#4A6888' }}>
        ← 돌아가기
      </button>

      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>WRITE</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>조황 올리기</h1>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
        {/* 작성자 (닉네임 자동입력) */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>작성자</label>
          <input
            type="text"
            value={nickname}
            readOnly
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13,31,53,0.5)', border: '1px solid rgba(45,95,153,0.3)', color: '#4A6888', cursor: 'default' }}
          />
        </div>

        {/* 어종 */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>어종</label>
          <div className="flex flex-wrap gap-2">
            {FISH_TYPES.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setForm(p => ({ ...p, fish_type: p.fish_type === f ? '' : f }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: form.fish_type === f ? '#C9A84C' : 'rgba(30,63,102,0.6)',
                  color: form.fish_type === f ? '#0D1F35' : '#4A6888',
                  border: form.fish_type === f ? 'none' : '1px solid rgba(45,95,153,0.3)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 출조일 */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>출조일</label>
          <input
            type="date"
            value={form.catch_date}
            onChange={e => setForm(p => ({ ...p, catch_date: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
          />
        </div>

        {/* 제목 */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>제목 *</label>
          <input
            type="text"
            placeholder="오늘 광어 대박났어요!"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>내용 *</label>
          <textarea
            rows={5}
            placeholder="조황 내용을 자유롭게 올려주세요"
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>사진 (최대 5장)</label>
          <div className="flex flex-wrap gap-2">
            {previews.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(45,95,153,0.4)' }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(248,113,113,0.9)', color: '#fff' }}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 text-xs"
                style={{ background: 'rgba(13,31,53,0.8)', border: '1px dashed rgba(45,95,153,0.5)', color: '#4A6888' }}
              >
                <span className="text-xl">+</span>
                사진 추가
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {error && <p className="text-xs text-center" style={{ color: '#F87171' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#C9A84C', color: '#0D1F35' }}
        >
          {submitting ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  )
}
