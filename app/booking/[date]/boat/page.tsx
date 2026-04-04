'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BoatMap from '@/components/booking/BoatMap'
import { useBookingStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { getReservedSeats, getBlockedSeats, formatDateKorean, formatPrice } from '@/lib/booking'
import type { SiteSettings } from '@/types'

export default function BoatSeatPage() {
  const params = useParams()
  const router = useRouter()
  const dateStr = params.date as string
  const supabase = createClient()

  const { selectedBusSeats, selectedBoatSpots, toggleBoatSpot, clearBoatSpots } = useBookingStore()

  const [reservedSpots, setReservedSpots] = useState<string[]>([])
  const [blockedSpots,  setBlockedSpots]  = useState<string[]>([])
  const [settings,      setSettings]      = useState<SiteSettings | null>(null)
  const [loading,       setLoading]        = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [reserved, blocked, { data: settingsData }] = await Promise.all([
        getReservedSeats(dateStr, 'boat'),
        getBlockedSeats(dateStr, 'boat'),
        supabase.from('site_settings').select('*').single(),
      ])
      setReservedSpots(reserved)
      setBlockedSpots(blocked)
      if (settingsData) setSettings(settingsData)
    } finally {
      setLoading(false)
    }
  }, [dateStr, supabase])

  useEffect(() => {
    if (selectedBusSeats.length === 0) {
      router.replace(`/booking/${dateStr}`)
      return
    }
    loadData()
  }, [selectedBusSeats, dateStr, router, loadData])

  const totalSpots  = 16
  const boatPrice   = settings?.boat_price ?? 30000
  const spotCount   = selectedBoatSpots.length
  const boatTotal   = spotCount * boatPrice
  const busTotal    = selectedBusSeats.length * (settings?.bus_price ?? 50000)
  const grandTotal  = busTotal + boatTotal

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-3"
            style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
          <p className="text-sm" style={{ color: '#4A6888' }}>자리 정보 불러오는 중...</p>
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
          <p className="text-xs font-medium" style={{ color: '#4A6888' }}>
            배 자리 선택 <span style={{ color: '#2D4A66' }}>(선택사항)</span>
          </p>
          <p className="text-sm font-bold leading-tight" style={{ color: '#F8F9FA' }}>
            {formatDateKorean(dateStr)}
          </p>
        </div>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => {
            const active = i === 1
            const done   = i < 1
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
                  <span className="text-[10px] font-medium" style={{ color: active ? '#C9A84C' : done ? '#8A9BB0' : '#3A5A7A' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 mb-4 mx-1" style={{ background: done ? 'rgba(201,168,76,0.4)' : 'rgba(45,95,153,0.3)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 실시간 선택 현황 */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: '#1E3F66', border: '1px solid rgba(45,95,153,0.4)' }}
        >
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#4A6888' }}>선택 자리</p>
            <p className="text-2xl font-black" style={{ color: spotCount > 0 ? '#C9A84C' : '#2D4A66' }}>
              {spotCount}자리
            </p>
          </div>
          <div className="w-px h-10" style={{ background: 'rgba(45,95,153,0.5)' }} />
          <div className="text-right">
            <p className="text-xs mb-0.5" style={{ color: '#4A6888' }}>총 금액</p>
            <p className="text-2xl font-black" style={{ color: '#C9A84C' }}>
              {grandTotal.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 버스 선택 확인 */}
        <div
          className="rounded-xl px-4 py-2.5 flex items-center gap-3"
          style={{ background: 'rgba(45,95,153,0.2)', border: '1px solid rgba(45,95,153,0.3)' }}
        >
          <span style={{ color: '#4A6888', fontSize: 12 }}>버스</span>
          <span className="text-sm font-bold" style={{ color: '#93C5FD' }}>
            {selectedBusSeats.join(', ')}번석
          </span>
          <span className="ml-auto text-xs font-semibold" style={{ color: '#C9A84C' }}>
            {busTotal.toLocaleString()}원
          </span>
        </div>

        {/* 안내 */}
        <div
          className="rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <span style={{ color: '#C9A84C', fontSize: 14 }}>◈</span>
          <p className="text-xs" style={{ color: '#93B5D4' }}>
            배 자리는 선택사항입니다. 다시 누르면 취소됩니다.
          </p>
        </div>

        {/* 배 자리 맵 */}
        <BoatMap
          totalSpots={totalSpots}
          reservedSpots={reservedSpots}
          blockedSpots={blockedSpots}
          selectedSpots={selectedBoatSpots}
          onToggle={toggleBoatSpot}
        />

        {/* 배 자리 요금 */}
        {settings && (
          <div
            className="rounded-xl px-4 py-2.5 flex items-center justify-between"
            style={{ background: 'rgba(30,63,102,0.5)', border: '1px solid rgba(45,95,153,0.3)' }}
          >
            <span className="text-xs" style={{ color: '#4A6888' }}>배 자리 추가 요금</span>
            <span className="text-sm font-bold" style={{ color: '#C9A84C' }}>
              {formatPrice(boatPrice)} / 자리
            </span>
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
            <span className="text-xs" style={{ color: '#4A6888' }}>
              버스 {selectedBusSeats.length}명{spotCount > 0 ? ` + 배 ${spotCount}자리` : ''}
            </span>
            <span className="text-xl font-black" style={{ color: '#C9A84C' }}>
              {formatPrice(grandTotal)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}
              onClick={() => router.push(`/booking/${dateStr}/confirm`)}
            >
              배 없이 결제
            </button>
            <button
              className="py-3.5 px-6 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{
                flex: 2,
                background: spotCount > 0 ? '#C9A84C' : '#1A2A3A',
                color: spotCount > 0 ? '#0D1F35' : '#3A4F66',
              }}
              disabled={spotCount === 0}
              onClick={() => router.push(`/booking/${dateStr}/confirm`)}
            >
              {spotCount > 0 ? `선택 완료 (${spotCount}자리) →` : '자리를 선택해 주세요'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
