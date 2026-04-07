'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NICKNAME_RE = /^[가-힣a-zA-Z0-9]{2,10}$/

export default function SetNicknamePage() {
  const router = useRouter()
  const supabase = createClient()
  const [nickname, setNickname] = useState('')
  const [checked, setChecked] = useState(false)
  const [available, setAvailable] = useState(false)
  const [checkMsg, setCheckMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
    })
  }, [])

  function handleNicknameChange(v: string) {
    setNickname(v)
    setChecked(false)
    setAvailable(false)
    setCheckMsg('')
  }

  async function handleCheck() {
    if (!NICKNAME_RE.test(nickname)) {
      setCheckMsg('2~10자, 한글/영문/숫자만 사용 가능합니다.')
      setAvailable(false)
      setChecked(true)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle()
    if (data) {
      setCheckMsg('이미 사용 중인 닉네임입니다.')
      setAvailable(false)
    } else {
      setCheckMsg('사용 가능한 닉네임입니다.')
      setAvailable(true)
    }
    setChecked(true)
  }

  async function handleSubmit() {
    if (!available) { setError('닉네임 중복 확인을 해주세요.'); return }
    setSubmitting(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, nickname })
    if (upsertError) {
      setError('저장 중 오류가 발생했습니다.')
      setSubmitting(false)
      return
    }
    router.replace('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D1F35' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl font-black mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#C9A84C' }}>좋은피싱</p>
          <p className="text-sm mt-1" style={{ color: '#4A6888' }}>사용할 닉네임을 설정해주세요</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>닉네임</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="2~10자, 한글/영문/숫자"
                value={nickname}
                onChange={e => handleNicknameChange(e.target.value)}
                maxLength={10}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
              />
              <button
                onClick={handleCheck}
                disabled={!nickname}
                className="px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap disabled:opacity-50 transition-all active:scale-95"
                style={{ background: '#2D5F99', color: '#F8F9FA' }}
              >
                중복 확인
              </button>
            </div>
            {checkMsg && (
              <p className="text-xs mt-1.5" style={{ color: available ? '#4ADE80' : '#F87171' }}>{checkMsg}</p>
            )}
          </div>

          {error && <p className="text-xs text-center" style={{ color: '#F87171' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !available}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#C9A84C', color: '#0D1F35' }}
          >
            {submitting ? '저장 중...' : '닉네임 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
