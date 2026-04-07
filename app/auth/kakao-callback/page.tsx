'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function KakaoCallbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) { setError('인증 코드가 없습니다'); return }
    handleCallback(code)
  }, [])

  async function handleCallback(code: string) {
    try {
      const redirectUri = `${window.location.origin}/auth/kakao-callback`

      // 서버에서 카카오 코드 → 토큰 교환
      const res = await fetch('/api/auth/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      })
      const data = await res.json()

      if (data.error || !data.id_token) {
        setError(data.error ?? '카카오 토큰 발급 실패. Kakao 앱에서 OpenID Connect 활성화가 필요합니다.')
        return
      }

      // Supabase ID 토큰으로 로그인
      const { error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'kakao',
        token: data.id_token,
      })

      if (authError) { setError(authError.message); return }

      router.replace('/')
    } catch {
      setError('로그인 중 오류가 발생했습니다')
    }
  }

  if (error) {
    return (
      <div style={{ background: '#0D1F35', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#F87171', fontSize: 14, marginBottom: 16 }}>{error}</p>
          <button onClick={() => router.push('/login')} style={{ color: '#C9A84C', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>로그인으로 돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0D1F35', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#4A6888', fontSize: 14 }}>카카오 로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0D1F35', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <KakaoCallbackInner />
    </Suspense>
  )
}
