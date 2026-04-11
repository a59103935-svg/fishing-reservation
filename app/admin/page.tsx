'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  // useMemo로 안정된 참조 유지 (매 렌더마다 새 객체 생성 방지)
  const supabase = useMemo(() => createClient(), [])

  const [authChecked, setAuthChecked] = useState(false)
  const [bookingTab, setBookingTab] = useState<'all' | 'date'>('all')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [feeForm, setFeeForm] = useState({ bus_price: '', boat_price: '' })
  const [feeSaving, setFeeSaving] = useState(false)
  const [feeSaved, setFeeSaved] = useState(false)
  const [cancelRequests, setCancelRequests] = useState<Booking[]>([])
  const [cancelLoading, setCancelLoading] = useState(false)

  // 출조 취소 공지
  const [tripCancellations, setTripCancellations] = useState<{ id: string; trip_date: string; reason: string }[]>([])
  const [tripCancelForm, setTripCancelForm] = useState({ trip_date: '', reason: '' })
  const [tripCancelSaving, setTripCancelSaving] = useState(false)

  // 예약 취소 확인 모달
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)

  // 관리자 인증 확인
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error) console.error('[auth] getUser error:', error)
        const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
        if (!user) {
          router.replace('/auth')
          return
        }
        if (adminId && user.id !== adminId) {
          router.replace('/')
          return
        }
        setAuthChecked(true)
      })
      .catch((err) => {
        console.error('[auth] unexpected error:', err)
        router.replace('/auth')
      })
  }, [supabase, router])

  useEffect(() => {
    if (!authChecked) return
    supabase.from('site_settings').select('id, bus_price, boat_price').single().then(({ data }) => {
      if (data) {
        setSettingsId(data.id)
        setFeeForm({ bus_price: String(data.bus_price), boat_price: String(data.boat_price) })
      }
    })
  }, [authChecked, supabase])

  const loadCancelRequests = useCallback(async () => {
    setCancelLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('cancel_status', 'pending')
      .order('cancel_requested_at', { ascending: true })
    setCancelRequests(data ?? [])
    setCancelLoading(false)
  }, [supabase])

  useEffect(() => { if (authChecked) loadCancelRequests() }, [authChecked, loadCancelRequests])

  const loadTripCancellations = useCallback(async () => {
    const { data, error } = await supabase
      .from('trip_cancellations')
      .select('id, trip_date, reason')
      .order('trip_date', { ascending: true })
    if (error) {
      console.warn('[loadTripCancellations] 테이블 없거나 에러 (무시):', error.message)
      setTripCancellations([])
      return
    }
    setTripCancellations(data ?? [])
  }, [supabase])

  useEffect(() => { if (authChecked) loadTripCancellations() }, [authChecked, loadTripCancellations])

  async function addTripCancellation() {
    if (!tripCancelForm.trip_date || !tripCancelForm.reason.trim()) {
      alert('날짜와 취소 사유를 입력해 주세요')
      return
    }
    setTripCancelSaving(true)
    const { error } = await supabase.from('trip_cancellations').upsert({
      trip_date: tripCancelForm.trip_date,
      reason: tripCancelForm.reason.trim(),
    }, { onConflict: 'trip_date' })
    setTripCancelSaving(false)
    if (error) { alert('등록 실패: ' + error.message); return }
    setTripCancelForm({ trip_date: '', reason: '' })
    loadTripCancellations()
  }

  async function deleteTripCancellation(id: string) {
    if (!confirm('이 취소 공지를 삭제하시겠습니까?')) return
    await supabase.from('trip_cancellations').delete().eq('id', id)
    loadTripCancellations()
  }

  async function handleCancelAction(bookingId: string, action: 'cancel_approve' | 'cancel_reject') {
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, action }),
    })
    if (res.ok) {
      loadCancelRequests()
      loadBookings(bookingTab, selectedDate)
    } else {
      const json = await res.json()
      alert('처리 실패: ' + (json.error ?? '알 수 없는 오류') + (json.detail ? `\n(${json.detail})` : ''))
    }
  }

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

  const loadBookings = useCallback(async (tab: 'all' | 'date', date: string) => {
    setLoading(true)
    try {
      const url = tab === 'all'
        ? '/api/admin/bookings'
        : `/api/admin/bookings?date=${date}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) {
        console.error('[loadBookings] API error:', json)
        setBookings([])
        return
      }
      setBookings(json ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authChecked) loadBookings(bookingTab, selectedDate)
  }, [authChecked, bookingTab, selectedDate, loadBookings])

  const activeBookings    = bookings.filter((b) => b.payment_status !== 'cancelled')
  const pendingBank       = bookings.filter((b) => b.payment_method === 'bank' && b.payment_status === 'pending')
  const confirmedBookings = bookings.filter((b) => b.payment_status === 'confirmed')
  const totalRevenue      = confirmedBookings.reduce((s, b) => s + b.total_amount, 0)

  const busSeats  = new Set(activeBookings.filter((b) => b.bus_seat_number).map((b) => b.bus_seat_number))
  const boatSpots = new Set(activeBookings.filter((b) => b.boat_spot_id).map((b) => b.boat_spot_id))

  async function confirmBooking(bookingId: string) {
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, action: 'confirm' }),
    })
    const json = await res.json()
    if (!res.ok) {
      console.error('[confirmBooking] 실패:', json)
      alert('처리 실패: ' + (json.error ?? '알 수 없는 오류') + (json.detail ? `\n(${json.detail})` : ''))
    }
    console.log('[confirmBooking] 결과:', res.status, json)
    await loadBookings(bookingTab, selectedDate)
  }

  async function cancelBooking(bookingId: string) {
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, action: 'cancel' }),
    })
    const json = await res.json()
    setCancelTargetId(null)
    if (!res.ok) {
      console.error('[cancelBooking] 실패:', json)
      alert('처리 실패: ' + (json.error ?? '알 수 없는 오류'))
      return
    }
    // 낙관적 업데이트: 즉시 취소 상태로 표시
    setBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, payment_status: 'cancelled' } : b)
    )
    // 목록 새로고침 (탭 무관)
    await loadBookings(bookingTab, selectedDate)
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0D1F35' }}>
        <p className="text-sm" style={{ color: '#4A6888' }}>인증 확인 중...</p>
      </div>
    )
  }

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

      {/* 출조 취소 공지 */}
      <div className="rounded-2xl p-4 space-y-4" style={{ background: '#1A3355', border: '1px solid rgba(239,68,68,0.35)' }}>
        <h2 className="font-bold" style={{ color: '#F8F9FA' }}>출조 취소 공지</h2>

        {/* 등록 폼 */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#4A6888' }}>취소 날짜</label>
              <input
                type="date"
                value={tripCancelForm.trip_date}
                onChange={(e) => setTripCancelForm((p) => ({ ...p, trip_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(239,68,68,0.4)', color: '#F8F9FA' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#4A6888' }}>취소 사유</label>
              <input
                type="text"
                placeholder="예: 기상 악화"
                value={tripCancelForm.reason}
                onChange={(e) => setTripCancelForm((p) => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
              />
            </div>
          </div>
          <button
            onClick={addTripCancellation}
            disabled={tripCancelSaving}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }}
          >
            {tripCancelSaving ? '등록 중...' : '취소 공지 등록'}
          </button>
        </div>

        {/* 등록된 목록 */}
        {tripCancellations.length === 0 ? (
          <p className="text-xs text-center py-2" style={{ color: '#4A6888' }}>등록된 취소 공지가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {tripCancellations.map((tc) => (
              <div key={tc.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F87171' }}>{tc.trip_date}</p>
                  <p className="text-xs" style={{ color: '#8A9BB0' }}>{tc.reason}</p>
                </div>
                <button
                  onClick={() => deleteTripCancellation(tc.id)}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 취소 신청 목록 */}
      {(cancelLoading || cancelRequests.length > 0) && (
        <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(248,113,113,0.3)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: '#F8F9FA' }}>취소 신청</h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}>
              {cancelRequests.length}건 대기
            </span>
          </div>

          {cancelLoading ? (
            <div className="py-4 text-center text-sm" style={{ color: '#4A6888' }}>불러오는 중...</div>
          ) : (
            <div className="space-y-3">
              {cancelRequests.map((b) => (
                <div key={b.id} className="rounded-xl p-3" style={{ background: 'rgba(13,31,53,0.5)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-sm" style={{ color: '#F8F9FA' }}>{b.customer_name}</span>
                      <span className="text-xs ml-2" style={{ color: '#4A6888' }}>{b.customer_phone}</span>
                      <p className="text-xs font-mono mt-0.5" style={{ color: '#3A5A7A' }}>{b.booking_number}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>출조일 {b.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#F8F9FA' }}>{(b.total_amount / 10000).toFixed(1)}만원</p>
                      <p className="text-xs font-semibold" style={{ color: '#F87171' }}>
                        환불 {b.refund_amount != null ? `${(b.refund_amount / 10000).toFixed(1)}만원` : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 text-sm font-bold py-2 rounded-lg transition-all active:scale-95"
                      style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.35)' }}
                      onClick={() => handleCancelAction(b.id, 'cancel_approve')}
                    >
                      취소 승인
                    </button>
                    <button
                      className="flex-1 text-sm font-semibold py-2 rounded-lg transition-all active:scale-95"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
                      onClick={() => handleCancelAction(b.id, 'cancel_reject')}
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 예약 목록 */}
      <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {(['all', 'date'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setBookingTab(tab)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: bookingTab === tab ? 'rgba(201,168,76,0.2)' : 'rgba(45,95,153,0.15)',
                color: bookingTab === tab ? '#C9A84C' : '#4A6888',
                border: `1px solid ${bookingTab === tab ? 'rgba(201,168,76,0.4)' : 'rgba(45,95,153,0.2)'}`,
              }}
            >
              {tab === 'all' ? '전체 예약' : '날짜별 조회'}
            </button>
          ))}
        </div>

        {/* 날짜 선택 (날짜별 탭일 때만) */}
        {bookingTab === 'date' && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: 'rgba(13,31,53,0.5)', border: '1px solid rgba(45,95,153,0.3)' }}>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            >‹</button>
            <div className="flex-1 text-center">
              <p className="text-sm font-bold" style={{ color: '#F8F9FA' }}>
                {isToday(new Date(selectedDate)) ? '오늘' : format(new Date(selectedDate), 'M월 d일 (E)', { locale: ko })}
              </p>
              <p className="text-xs" style={{ color: '#4A6888' }}>{selectedDate}</p>
            </div>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            >›</button>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold" style={{ color: '#F8F9FA' }}>
            {bookingTab === 'all' ? `전체 예약 (${activeBookings.length}건)` : `예약 목록 (${activeBookings.length}건)`}
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
                onCancel={() => setCancelTargetId(booking.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 예약 취소 확인 모달 */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-6 w-80 space-y-4" style={{ background: '#1A3355', border: '1px solid rgba(248,113,113,0.4)' }}>
            <h3 className="text-lg font-bold text-center" style={{ color: '#F8F9FA' }}>예약 취소</h3>
            <p className="text-sm text-center" style={{ color: '#8A9BB0' }}>정말 이 예약을 취소하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ background: 'rgba(45,95,153,0.3)', color: '#8A9BB0', border: '1px solid rgba(45,95,153,0.4)' }}
                onClick={() => setCancelTargetId(null)}
              >
                닫기
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ background: 'rgba(248,113,113,0.2)', color: '#F87171', border: '1px solid rgba(248,113,113,0.5)' }}
                onClick={() => cancelBooking(cancelTargetId)}
              >
                취소 확인
              </button>
            </div>
          </div>
        </div>
      )}
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
        background: isCancelled
          ? 'rgba(30,30,40,0.5)'
          : isConfirmed
          ? 'rgba(201,168,76,0.07)'
          : 'rgba(251,191,36,0.06)',
        border: `1px solid ${
          isCancelled ? 'rgba(80,80,100,0.3)' : isConfirmed ? 'rgba(201,168,76,0.3)' : 'rgba(251,191,36,0.2)'
        }`,
        opacity: isCancelled ? 0.5 : 1,
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
