'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BusSeatMap from '@/components/booking/BusSeatMap'
import { useBookingStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { getReservedSeats, getBlockedSeats, formatDateKorean, formatPrice, UNIFIED_PRICE_PER_PERSON } from '@/lib/booking'
import type { SiteSettings } from '@/types'

export default function BusSeatPage() {
  const params = useParams()
  const router = useRouter()
  const dateStr = params.date as string
  const supabase = createClient()

  const { selectedDate, selectedBusSeats, setDate, toggleBusSeat, clearBusSeats } = useBookingStore()

  const [reservedSeats, setReservedSeats] = useState<string[]>([])
  const [blockedSeats,  setBlockedSeats]  = useState<string[]>([])
  const [settings,      setSettings]      = useState<SiteSettings | null>(null)
  const [loading,       setLoading]        = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [reserved, blocked, { data: settingsData }] = await Promise.all([
        getReservedSeats(dateStr, 'bus'),
        getBlockedSeats(dateStr, 'bus'),
        supabase.from('site_settings').select('*').single(),
      ])
      setReservedSeats(reserved)
      setBlockedSeats(blocked)
      if (settingsData) setSettings(settingsData)
    } finally {
      setLoading(false)
    }
  }, [dateStr, supabase])

  useEffect(() => {
    if (selectedDate !== dateStr) setDate(dateStr)
    loadData()
  }, [dateStr, selectedDate, setDate, loadData])

  const totalSeats  = settings?.bus_total_seats ?? 30
  const seatCount   = selectedBusSeats.length
  const totalAmount = seatCount * UNIFIED_PRICE_PER_PERSON

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-3"
            style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
          <p className="text-sm" style={{ color: '#4A6888' }}>좌석 정보 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const STEPS = ['버스 좌석', '배 자리', '예약 확정']

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-36" style={{ background: '#0D1F35' }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: '#0D1F35', borderBottom: '1px solid rgba(45,95,153,0.3)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90"
          style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: '#4A6888' }}>버스 좌석 선택</p>
          <p className="text-sm font-bold leading-tight" style={{ color: '#F8F9FA' }}>
            {formatDateKorean(dateStr)}
          </p>
        </div>
        {settings && (
          <div className="text-right">
            <p className="text-xs" style={{ color: '#4A6888' }}>
              출발 <span style={{ color: '#C9A84C', fontWeight: 700 }}>{settings.departure_time.slice(0, 5)}</span>
            </p>
          </div>
        )}
      </header>

      {/* 스텝 인디케이터 */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => {
            const active = i === 0
            const done   = i < 0
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                    style={{
                      background: active ? '#C9A84C' : done ? 'rgba(201,168,76,0.3)' : 'rgba(45,95,153,0.25)',
                      color:      active ? '#0D1F35' : done ? '#C9A84C' : '#3A5A7A',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: active ? '#C9A84C' : '#3A5A7A' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 mb-4 mx-1" style={{ background: i < 0 ? 'rgba(201,168,76,0.4)' : 'rgba(45,95,153,0.3)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 실시간 선택 현황 */}
      <div className="px-4 pt-4">
        <div
          className="rounded-2xl px-5 py-4 mb-4 flex items-center justify-between"
          style={{ background: '#1E3F66', border: '1px solid rgba(45,95,153,0.4)' }}
        >
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#4A6888' }}>선택 인원</p>
            <p className="text-2xl font-black" style={{ color: seatCount > 0 ? '#C9A84C' : '#2D4A66' }}>
              {seatCount}명
            </p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(45,95,153,0.5)' }} />
          <div className="text-right">
            <p className="text-xs mb-0.5" style={{ color: '#4A6888' }}>예상 금액</p>
            <p className="text-2xl font-black" style={{ color: seatCount > 0 ? '#C9A84C' : '#2D4A66' }}>
              {totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '—'}
            </p>
          </div>
        </div>

        {/* 안내 */}
        <div
          className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <span style={{ color: '#C9A84C', fontSize: 14 }}>◈</span>
          <p className="text-xs" style={{ color: '#93B5D4' }}>
            좌석을 인원수만큼 선택해 주세요. 다시 누르면 취소됩니다.
          </p>
        </div>

        {/* 버스 좌석 맵 */}
        <BusSeatMap
          totalSeats={totalSeats}
          reservedSeats={reservedSeats}
          blockedSeats={blockedSeats}
          selectedSeats={selectedBusSeats}
          onToggle={toggleBusSeat}
        />

        {/* 선택된 좌석 */}
        {seatCount > 0 && (
          <div
            className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#C9A84C' }}>선택한 좌석</p>
              <p className="text-sm font-bold" style={{ color: '#F8F9FA' }}>
                {selectedBusSeats.join(', ')}번석
              </p>
            </div>
            <button
              onClick={clearBusSeats}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ color: '#F87171', background: 'rgba(248,113,113,0.1)' }}
            >
              전체 취소
            </button>
          </div>
        )}
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div
          className="max-w-sm mx-auto px-4 pt-3 pb-6"
          style={{ background: '#081628', borderTop: '1px solid rgba(45,95,153,0.4)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: '#4A6888' }}>
              총 결제금액{seatCount > 0 ? ` (${seatCount}석)` : ''}
            </span>
            <span className="text-xl font-black" style={{ color: seatCount > 0 ? '#C9A84C' : '#2D4A66' }}>
              {formatPrice(totalAmount)}
            </span>
          </div>
          <button
            className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: seatCount > 0 ? '#C9A84C' : '#1A2A3A',
              color: seatCount > 0 ? '#0D1F35' : '#3A4F66',
            }}
            disabled={seatCount === 0}
            onClick={() => router.push(`/booking/${dateStr}/boat`)}
          >
            {seatCount > 0 ? `선택 완료 (${seatCount}석) →` : '좌석을 선택해 주세요'}
          </button>
        </div>
      </div>
    </div>
  )
}
