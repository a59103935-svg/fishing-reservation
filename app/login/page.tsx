'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REDIRECT_URL = 'https://fishing-reservation.vercel.app/auth/callback'

function formatPhoneE164(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) return '+82' + clean.slice(1)
  return '+82' + clean
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  function handleKakaoLogin() {
    const REST_API_KEY = 'ac1b77e9c91483137d68c5448e932b4e'
    const redirectUri = `${window.location.origin}/auth/kakao-callback`
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname%20profile_image%20openid`
    window.location.href = kakaoAuthUrl
  }

  async function handleSendOtp() {
    const e164 = formatPhoneE164(phone)
    if (e164.length < 12) { setError('올바른 전화번호를 입력해 주세요'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
    setLoading(false)
    if (error) { setError(error.message); return }
    setOtpSent(true)
    setInfo('인증번호가 발송됐습니다')
  }

  async function handleVerifyOtp() {
    const e164 = formatPhoneE164(phone)
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token: otp, type: 'sms' })
    setLoading(false)
    if (error) { setError('인증번호가 올바르지 않습니다'); return }
    router.replace('/')
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
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            style={{ background: '#FEE500', color: '#191919' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.12 1.27 3.99 3.19 5.11L3.75 16.5l3.82-2.53c.47.07.95.1 1.43.1 4.14 0 7.5-2.69 7.5-6 0-3.31-3.36-6-7.5-6z" fill="#191919"/>
            </svg>
            카카오로 로그인
          </button>

          {/* 네이버 로그인 (준비중) */}
          <button
            disabled
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
            style={{ background: '#03C75A', color: '#fff' }}
          >
            <span className="font-black text-base leading-none">N</span>
            네이버로 로그인 (준비중)
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'rgba(45,95,153,0.4)' }} />
            <span className="text-xs" style={{ color: '#4A6888' }}>또는</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(45,95,153,0.4)' }} />
          </div>

          {/* 전화번호 인증 */}
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: '#93B5D4' }}>전화번호 인증</label>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={otpSent}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
                style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
              />
              <button
                onClick={otpSent ? () => { setOtpSent(false); setOtp(''); setInfo('') } : handleSendOtp}
                disabled={loading || !phone}
                className="px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap disabled:opacity-50 transition-all active:scale-95"
                style={{ background: '#C9A84C', color: '#0D1F35' }}
              >
                {otpSent ? '재발송' : '인증번호 받기'}
              </button>
            </div>

            {otpSent && (
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="6자리 인증번호"
                  value={otp}
                  onChange={e => setOtp(e.target.value.slice(0, 6))}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: '#2D5F99', color: '#F8F9FA' }}
                >
                  확인
                </button>
              </div>
            )}
          </div>

          {info && <p className="text-xs text-center" style={{ color: '#C9A84C' }}>{info}</p>}
          {error && <p className="text-xs text-center" style={{ color: '#F87171' }}>{error}</p>}
        </div>

        <button onClick={() => router.back()} className="w-full mt-4 text-xs text-center" style={{ color: '#4A6888' }}>
          돌아가기
        </button>
      </div>
    </div>
  )
}
