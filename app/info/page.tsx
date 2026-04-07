'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatTime } from '@/lib/booking'
import type { SiteSettings } from '@/types'

export default function InfoPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('*').single().then(({ data }) => {
      if (data) setSettings(data)
      setLoading(false)
    })
  }, [supabase])

  function copyAccount() {
    if (!settings) return
    navigator.clipboard.writeText(settings.bank_account).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <p className="text-sm" style={{ color: '#4A6888' }}>정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-28" style={{ background: '#0D1F35' }}>
      {/* 헤더 */}
      <div className="px-5 pt-10 pb-5">
        <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>GOOD FISHING</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>좋은피싱</h1>
        <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>출조 안내 · 이용 정보</p>
      </div>

      <div className="px-4 space-y-3">

        {/* 출조 시간 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>출조 일정</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
              >출발</div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#4A6888' }}>버스 출발</p>
                <p className="text-xl font-black" style={{ color: '#F8F9FA' }}>{formatTime(settings.departure_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
              >귀항</div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#4A6888' }}>귀항 예정</p>
                <p className="text-xl font-black" style={{ color: '#F8F9FA' }}>{formatTime(settings.return_time)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 집결 장소 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>집결 장소</p>
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
              style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
            >위치</div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#F8F9FA' }}>출발지 정류장</p>
              <p className="text-xs mt-1" style={{ color: '#4A6888' }}>
                예약 확정 후 카카오 알림톡으로 정확한 위치를 안내드립니다.
              </p>
              <p className="text-xs mt-1" style={{ color: '#93B5D4' }}>
                출발 <span className="font-bold" style={{ color: '#C9A84C' }}>30분 전</span>까지 도착해 주세요
              </p>
            </div>
          </div>
        </section>

        {/* 요금 안내 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>요금 안내</p>
          <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(45,95,153,0.3)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F8F9FA' }}>버스+배 통합 요금</p>
              <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>1인 기준 · 당일 점심·저녁, 다음날 조식 3끼 제공</p>
            </div>
            <p className="text-lg font-black" style={{ color: '#C9A84C' }}>260,000원</p>
          </div>
          <p className="text-xs mt-3" style={{ color: '#C9A84C' }}>
            ※ 중동 정세 불안으로 인한 유류비 상승으로 요금이 변동될 수 있습니다. 양해 부탁드립니다.
          </p>
        </section>

        {/* 무통장 입금 계좌 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>무통장 입금 계좌</p>
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>
                {settings.bank_name} · {settings.bank_holder}
              </p>
              <p className="text-lg font-black tracking-wide" style={{ color: '#F8F9FA' }}>{settings.bank_account}</p>
            </div>
            <button
              onClick={copyAccount}
              className="shrink-0 ml-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
              style={{ background: '#C9A84C', color: '#0D1F35' }}
            >
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#4A6888' }}>입금자명을 예약자명과 동일하게 입력해 주세요.</p>
        </section>

        {/* 준비물 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>준비물</p>
          <div className="grid grid-cols-2 gap-2">
            {['낚시 장비', '미끼', '방한복', '편광 선글라스', '멀미약', '간식·음료'].map((item) => (
              <div
                key={item}
                className="rounded-xl px-3 py-2 text-xs font-medium text-center"
                style={{ background: 'rgba(45,95,153,0.3)', color: '#93B5D4' }}
              >
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#4A6888' }}>
            * 낚시 장비 및 미끼는 현장 구매 가능합니다
          </p>
        </section>

        {/* 유의사항 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>유의사항</p>
          <ul className="space-y-3">
            {[
              '예약 후 24시간 이내 입금 확인이 필요합니다.',
              '출발 2일 전까지 취소 시 100% 환불됩니다.',
              '출발 당일 취소 시 환불이 불가합니다.',
              '구명조끼는 필수 착용이며 현장 제공됩니다.',
              '기상 악화 시 출조가 취소될 수 있습니다.',
              '음주 후 승선은 안전을 위해 금지됩니다.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
                >
                  {i + 1}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: '#93B5D4' }}>{item}</span>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  )
}
