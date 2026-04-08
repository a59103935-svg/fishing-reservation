'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import {
  formatPrice,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/lib/booking'
import type { Booking } from '@/types'

export default function AdminDashboard() {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [feeForm, setFeeForm] = useState({ bus_price: '', boat_price: '' })
  const [feeSaving, setFeeSaving] = useState(false)
  const [feeSaved, setFeeSaved] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('id, bus_price, boat_price').single().then(({ data }) => {
      if (data) {
        setSettingsId(data.id)
        setFeeForm({ bus_price: String(data.bus_price), boat_price: String(data.boat_price) })
      }
    })
  }, [])

  async function saveFee() {
    if (!settingsId) return
    setFeeSaving(true)
    await supabase.from('site_settings').update({
      bus_price: Number(feeForm.bus_price) || 0,
      boat_price: Number(feeForm.boat_price) || 0,
    }).eq('id', settingsId)
    setFeeSaving(false)
    setFeeSaved(true)
    setTimeout(() => setFeeSaved(false), 2500)
  }

  const loadBookings = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('bookings')
        .select(`*, product_orders(*, product:products(*))`)
        .eq('date', date)
        .order('created_at', { ascending: false })

      setBookings(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadBookings(selectedDate)
  }, [selectedDate, loadBookings])

  const activeBookings    = bookings.filter((b) => b.payment_status !== 'cancelled')
  const pendingBank       = bookings.filter((b) => b.payment_method === 'bank' && b.payment_status === 'pending')
  const confirmedBookings = bookings.filter((b) => b.payment_status === 'confirmed')
  const totalRevenue      = confirmedBookings.reduce((s, b) => s + b.total_amount, 0)

  const busSeats  = new Set(activeBookings.filter((b) => b.bus_seat_number).map((b) => b.bus_seat_number))
  const boatSpots = new Set(activeBookings.filter((b) => b.boat_spot_id).map((b) => b.boat_spot_id))

  async function confirmBooking(bookingId: string) {
    await supabase
      .from('bookings')
      .update({ payment_status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', bookingId)
    loadBookings(selectedDate)
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm('정말 취소하시겠습니까?')) return
    await supabase
      .from('bookings')
      .update({ payment_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)
    loadBookings(selectedDate)
  }

  const displayDate = isToday(new Date(selectedDate))
    ? '오늘'
    : format(new Date(selectedDate), 'M월 d일 (E)', { locale: ko })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" style={{ background: '#0D1F35', minHeight: '100vh' }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>ADMIN</p>
          <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>관리자 대시보드</h1>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          좋은피싱
        </div>
      </div>

      {/* 날짜 선택 */}
      <div className="rounded-2xl px-4 py-4" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-90"
            style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <p className="text-xl font-black" style={{ color: '#F8F9FA' }}>{displayDate}</p>
            <p className="text-xs" style={{ color: '#4A6888' }}>{selectedDate}</p>
          </div>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-90"
            style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
          >
            ›
          </button>
        </div>
        <div className="mt-3 text-center">
          <button
            className="text-sm font-semibold"
            style={{ color: '#C9A84C' }}
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
          >
            오늘로 이동
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <DarkStatCard
          label="버스 예약"
          value={`${busSeats.size} / 30석`}
          icon="▣"
          color="blue"
        />
        <DarkStatCard
          label="배 예약"
          value={`${boatSpots.size} / 20자리`}
          icon="◈"
          color="cyan"
        />
        <DarkStatCard
          label="입금 미확인"
          value={`${pendingBank.length}건`}
          icon="◉"
          color={pendingBank.length > 0 ? 'red' : 'gray'}
          alert={pendingBank.length > 0}
        />
        <DarkStatCard
          label="확정 매출"
          value={totalRevenue > 0 ? `${(totalRevenue / 10000).toFixed(0)}만원` : '0원'}
          icon="◆"
          color="gold"
        />
      </div>

      {/* 버스 좌석 미니맵 */}
      <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
        <h2 className="font-bold mb-3" style={{ color: '#F8F9FA' }}>버스 좌석 현황</h2>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className="w-8 h-7 rounded text-xs flex items-center justify-center font-semibold"
              style={{
                background: busSeats.has(num) ? 'rgba(248,113,113,0.25)' : 'rgba(45,95,153,0.2)',
                color: busSeats.has(num) ? '#F87171' : '#3A5A7A',
                border: busSeats.has(num) ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(45,95,153,0.2)',
              }}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5" style={{ color: '#4A6888' }}>
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(248,113,113,0.25)', border: '1px solid rgba(248,113,113,0.4)', display: 'inline-block' }} />
            예약됨
          </span>
          <span className="flex items-center gap-1.5" style={{ color: '#4A6888' }}>
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(45,95,153,0.2)', display: 'inline-block' }} />
            공석
          </span>
        </div>
      </div>

      {/* 배 자리 미니맵 */}
      <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
        <h2 className="font-bold mb-3" style={{ color: '#F8F9FA' }}>배 자리 현황</h2>
        <div className="grid grid-cols-5 gap-1">
          {['F1','F2','F3','F4','F5','L1','L2','L3','L4','L5','R1','R2','R3','R4','R5','B1','B2','B3','B4','B5'].map((id) => (
            <div
              key={id}
              className="h-7 rounded text-xs flex items-center justify-center font-semibold"
              style={{
                background: boatSpots.has(id) ? 'rgba(248,113,113,0.25)' : 'rgba(45,95,153,0.2)',
                color: boatSpots.has(id) ? '#F87171' : '#3A5A7A',
                border: boatSpots.has(id) ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(45,95,153,0.2)',
              }}
            >
              {id}
            </div>
          ))}
        </div>
      </div>

      {/* 요금 설정 */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
        <h2 className="font-bold" style={{ color: '#F8F9FA' }}>요금 설정</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#4A6888' }}>버스요금 (원)</label>
            <input
              type="number"
              value={feeForm.bus_price}
              onChange={e => setFeeForm(p => ({ ...p, bus_price: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#4A6888' }}>배삯 (원)</label>
            <input
              type="number"
              value={feeForm.boat_price}
              onChange={e => setFeeForm(p => ({ ...p, boat_price: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#4A6888' }}>
            총 비용: <span style={{ color: '#C9A84C', fontWeight: 700 }}>
              {((Number(feeForm.bus_price) || 0) + (Number(feeForm.boat_price) || 0)).toLocaleString()}원
            </span>
          </span>
          <button
            onClick={saveFee}
            disabled={feeSaving}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: feeSaved ? 'rgba(74,222,128,0.2)' : 'rgba(201,168,76,0.2)', color: feeSaved ? '#4ADE80' : '#C9A84C', border: `1px solid ${feeSaved ? 'rgba(74,222,128,0.4)' : 'rgba(201,168,76,0.4)'}` }}
          >
            {feeSaving ? '저장 중...' : feeSaved ? '✓ 저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold" style={{ color: '#F8F9FA' }}>
            예약 목록 ({activeBookings.length}건)
          </h2>
          {pendingBank.length > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              입금대기 {pendingBank.length}건
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center" style={{ color: '#4A6888' }}>불러오는 중...</div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center" style={{ color: '#4A6888' }}>예약이 없습니다</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onConfirm={() => confirmBooking(booking.id)}
                onCancel={() => cancelBooking(booking.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DarkStatCard({
  label,
  value,
  icon,
  color,
  alert,
}: {
  label: string
  value: string
  icon: string
  color: string
  alert?: boolean
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue:  { bg: 'rgba(45,95,153,0.2)',  border: 'rgba(45,95,153,0.4)',    text: '#93C5FD' },
    cyan:  { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', text: '#67E8F9' },
    green: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#6EE7B7' },
    gold:  { bg: 'rgba(201,168,76,0.1)',  border: 'rgba(201,168,76,0.3)',   text: '#C9A84C' },
    red:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)',  text: '#F87171' },
    gray:  { bg: 'rgba(45,95,153,0.12)', border: 'rgba(45,95,153,0.25)',   text: '#4A6888' },
  }

  const c = colorMap[color] ?? colorMap.gray

  return (
    <div
      className="rounded-2xl p-4 relative"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {alert && (
        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#F87171' }} />
      )}
      <div className="text-xl mb-1" style={{ color: c.text }}>{icon}</div>
      <p className="text-xl font-black" style={{ color: c.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>{label}</p>
    </div>
  )
}

function BookingCard({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: Booking
  onConfirm: () => void
  onCancel: () => void
}) {
  const isConfirmed  = booking.payment_status === 'confirmed'
  const isCancelled  = booking.payment_status === 'cancelled'

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: isConfirmed
          ? 'rgba(201,168,76,0.07)'
          : isCancelled
          ? 'rgba(45,95,153,0.08)'
          : 'rgba(251,191,36,0.06)',
        border: `1px solid ${
          isConfirmed ? 'rgba(201,168,76,0.3)' : isCancelled ? 'rgba(45,95,153,0.2)' : 'rgba(251,191,36,0.2)'
        }`,
        opacity: isCancelled ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: '#F8F9FA' }}>{booking.customer_name}</span>
            <span className="text-xs" style={{ color: '#4A6888' }}>{booking.customer_phone}</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#3A5A7A' }}>{booking.booking_number}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {booking.bus_seat_number && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}
              >
                버스 {booking.bus_seat_number}번석
              </span>
            )}
            {booking.boat_spot_id && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(34,211,238,0.1)', color: '#67E8F9' }}
              >
                배 {booking.boat_spot_id}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(45,95,153,0.2)', color: '#8A9BB0' }}
            >
              {getPaymentMethodLabel(booking.payment_method)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold" style={{ color: '#C9A84C' }}>{formatPrice(booking.total_amount)}</p>
          {isConfirmed ? (
            <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>✓ 확정</span>
          ) : isCancelled ? (
            <span className="text-xs" style={{ color: '#4A6888' }}>취소됨</span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#FBBF24' }}>대기중</span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      {!isCancelled && (
        <div className="flex gap-2 mt-2">
          {booking.payment_status === 'pending' && (
            <button
              className="flex-1 text-sm font-bold py-2 rounded-lg transition-all active:scale-95"
              style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}
              onClick={onConfirm}
            >
              ✓ 입금확인
            </button>
          )}
          <button
            className="flex-1 text-sm font-semibold py-2 rounded-lg transition-all active:scale-95"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
