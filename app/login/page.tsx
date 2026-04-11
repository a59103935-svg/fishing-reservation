'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleKakaoLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) alert('카카오 로그인 오류: ' + error.message)
  }

  function handleNaverLogin() {
    alert('네이버 로그인은 준비 중입니다. 카카오로 로그인해 주세요.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D1F35' }}>
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <p className="text-3xl font-black mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#C9A84C' }}>좋은피싱</p>
          <p className="text-sm" style={{ color: '#4A6888' }}>로그인하여 조황을 공유하세요</p>
        </div>

        <div className="rounded-2xl p-6 space-y-3" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: '#FEE500', color: '#191919' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.12 1.27 3.99 3.19 5.11L3.75 16.5l3.82-2.53c.47.07.95.1 1.43.1 4.14 0 7.5-2.69 7.5-6 0-3.31-3.36-6-7.5-6z" fill="#191919"/>
            </svg>
            카카오로 로그인
          </button>

          {/* 네이버 로그인 */}
          <button
            onClick={handleNaverLogin}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: '#03C75A', color: '#fff' }}
          >
            <span className="font-black text-base leading-none">N</span>
            네이버로 로그인
          </button>
        </div>

        <button onClick={() => router.back()} className="w-full mt-4 text-xs text-center" style={{ color: '#4A6888' }}>
          돌아가기
        </button>
      </div>
    </div>
  )
}
