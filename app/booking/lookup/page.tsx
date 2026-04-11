'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateKorean, formatPrice } from '@/lib/booking'
import type { Booking } from '@/types'

// 환불 정책: 예약일 기준 오늘로부터 일수 차이
function calcRefund(bookingDate: string, totalAmount: number): { rate: number; amount: number; label: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(bookingDate)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays >= 2) return { rate: 100, amount: totalAmount, label: '100% 환불' }
  if (diffDays === 1) return { rate: 80, amount: Math.floor(totalAmount * 0.8), label: '80% 환불 (1일 전)' }
  return { rate: 0, amount: 0, label: '환불 불가 (당일)' }
}

function LookupContent() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ customer_name: '', customer_phone: '' })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [cancelledDates, setCancelledDates] = useState<Map<string, string>>(new Map()) // date → reason

  // 취소 모달 대상 booking + 완료된 id set
  const [modalBooking, setModalBooking] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDoneIds, setCancelDoneIds] = useState<Set<string>>(new Set())

  async function search() {
    const name = form.customer_name.trim()
    const phone = form.customer_phone.replace(/\D/g, '')
    if (!name || !phone) {
      setSearchErr('이름과 연락처를 모두 입력해 주세요')
      return
    }
    setSearching(true)
    setSearchErr('')
    setBookings([])
    setSearched(false)

    // KST 오늘 날짜 (UTC+9)
    const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_name', name)
      .gte('date', todayKST)
      .order('date', { ascending: false })

    setSearching(false)
    setSearched(true)

    if (!data || data.length === 0) {
      setSearchErr('예약을 찾을 수 없습니다. 이름과 연락처를 확인해 주세요.')
      return
    }

    // 연락처 숫자만 비교
    const matched = data.filter((b) => b.customer_phone.replace(/\D/g, '') === phone)
    if (matched.length === 0) {
      setSearchErr('예약을 찾을 수 없습니다. 이름과 연락처를 확인해 주세요.')
      return
    }

    setBookings(matched)

    // 예약 날짜 중 취소된 날짜 조회
    const dates = matched.map((b) => b.date)
    const { data: cancels } = await supabase
      .from('trip_cancellations')
      .select('trip_date, reason')
      .in('trip_date', dates)
    if (cancels && cancels.length > 0) {
      const map = new Map<string, string>()
      cancels.forEach((c) => map.set(c.trip_date, c.reason))
      setCancelledDates(map)
    } else {
      setCancelledDates(new Map())
    }
  }

  async function requestCancel() {
    if (!modalBooking) return
    setCancelling(true)
    const { rate, amount } = calcRefund(modalBooking.date, modalBooking.total_amount)

    const res = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: modalBooking.id, refund_amount: amount, refund_rate: rate }),
    })

    setCancelling(false)
    if (res.ok) {
      // 목록에서 해당 booking 업데이트
      setBookings((prev) =>
        prev.map((b) =>
          b.id === modalBooking.id
            ? { ...b, cancel_status: 'pending', cancel_requested_at: new Date().toISOString(), refund_amount: amount }
            : b
        )
      )
      setCancelDoneIds((prev) => new Set(prev).add(modalBooking.id))
      setModalBooking(null)
    } else {
      const json = await res.json()
      alert('취소 신청 실패: ' + (json.error ?? '알 수 없는 오류'))
    }
  }

  const modalRefund = modalBooking ? calcRefund(modalBooking.date, modalBooking.total_amount) : null

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-12 px-4" style={{ background: '#0D1F35' }}>
      {/* 헤더 */}
      <div className="pt-12 pb-8 text-center relative">
        <button
          onClick={() => router.push('/')}
          className="absolute left-0 top-1 text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C' }}
        >
          ← 홈
        </button>
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>RESERVATION</p>
        <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>예약 조회</h1>
        <p className="text-xs mt-1" style={{ color: '#4A6888' }}>이름과 연락처로 조회합니다</p>
      </div>

      {/* 검색 폼 */}
      <div className="rounded-2xl p-5 space-y-4 mb-5" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C9A84C' }}>이름</label>
          <input
            type="text"
            placeholder="홍길동"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#C9A84C' }}>연락처</label>
          <input
            type="tel"
            placeholder="01012345678"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            inputMode="numeric"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        {searchErr && <p className="text-xs font-semibold" style={{ color: '#F87171' }}>{searchErr}</p>}
        <button
          onClick={search}
          disabled={searching}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#C9A84C', color: '#0D1F35' }}
        >
          {searching ? '조회 중...' : '예약 조회하기'}
        </button>
      </div>

      {/* 조회 결과 */}
      {searched && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.length > 1 && (
            <p className="text-xs text-center font-semibold" style={{ color: '#8A9BB0' }}>
              예약 {bookings.length}건이 조회됐습니다
            </p>
          )}

          {bookings.map((booking) => {
            const canCancel = booking.payment_status !== 'cancelled' && !booking.cancel_status
            const justDone = cancelDoneIds.has(booking.id)

            const cancelReason = cancelledDates.get(booking.date)

            return (
              <div key={booking.id} className="space-y-2">
                {/* 출조 취소 배너 */}
                {cancelReason && (
                  <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}>
                    <span className="text-base mt-0.5 shrink-0">⚠️</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#EF4444' }}>해당 날짜 출조가 취소됐습니다</p>
                      <p className="text-xs mt-0.5" style={{ color: '#F87171' }}>사유: {cancelReason}</p>
                      <p className="text-xs mt-1" style={{ color: '#8A9BB0' }}>환불 문의: 010-5910-3935</p>
                    </div>
                  </div>
                )}
                {justDone && (
                  <div className="rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
                    취소 신청이 접수됐습니다. 관리자 검토 후 환불이 진행됩니다.
                  </div>
                )}

                <div className="rounded-2xl p-5" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold tracking-widest" style={{ color: '#C9A84C' }}>예약 정보</p>
                    <StatusBadge status={booking.payment_status} cancelStatus={booking.cancel_status} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <Row label="예약번호" value={booking.booking_number} mono />
                    <Row label="출조일" value={formatDateKorean(booking.date)} />
                    <Row label="이름" value={booking.customer_name} />
                    <Row label="연락처" value={booking.customer_phone} />
                    {booking.bus_seat_number != null && <Row label="버스 좌석" value={`${booking.bus_seat_number}번석`} />}
                    {booking.boat_spot_id && <Row label="배 자리" value={booking.boat_spot_id} />}
                    <div className="pt-2" style={{ borderTop: '1px solid rgba(45,95,153,0.3)' }}>
                      <Row label="결제금액" value={formatPrice(booking.total_amount)} highlight />
                    </div>
                  </div>

                  {booking.cancel_status === 'pending' && (
                    <div className="mt-4 rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#FBBF24' }}>
                      취소 신청 검토 중 — 예상 환불 {formatPrice(booking.refund_amount ?? 0)}
                    </div>
                  )}
                  {booking.cancel_status === 'approved' && (
                    <div className="mt-4 rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ADE80' }}>
                      취소 승인됨 — 환불 {formatPrice(booking.refund_amount ?? 0)} 처리 예정
                    </div>
                  )}
                  {booking.cancel_status === 'rejected' && (
                    <div className="mt-4 rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171' }}>
                      취소 신청이 거절됐습니다. 문의: 010-5910-3935
                    </div>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setModalBooking(booking)}
                      className="w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }}
                    >
                      취소 신청
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* 환불 정책 안내 */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(45,95,153,0.1)', border: '1px solid rgba(45,95,153,0.25)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#93B5D4' }}>환불 정책</p>
            <ul className="text-xs space-y-1" style={{ color: '#4A6888' }}>
              <li>• 출조 2일 전 이상: <span style={{ color: '#C9A84C' }}>100% 환불</span></li>
              <li>• 출조 1일 전: <span style={{ color: '#C9A84C' }}>80% 환불</span></li>
              <li>• 출조 당일: <span style={{ color: '#F87171' }}>환불 불가</span></li>
            </ul>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {modalBooking && modalRefund && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => !cancelling && setModalBooking(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl p-6 space-y-5"
            style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <p className="text-base font-black mb-1" style={{ color: '#F8F9FA' }}>취소 신청 확인</p>
              <p className="text-xs" style={{ color: '#4A6888' }}>{formatDateKorean(modalBooking.date)} 출조 예약</p>
            </div>

            <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: 'rgba(13,31,53,0.6)', border: '1px solid rgba(45,95,153,0.3)' }}>
              <div className="flex justify-between">
                <span style={{ color: '#4A6888' }}>결제금액</span>
                <span style={{ color: '#F8F9FA', fontWeight: 600 }}>{formatPrice(modalBooking.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#4A6888' }}>환불 기준</span>
                <span style={{ color: modalRefund.rate === 0 ? '#F87171' : '#C9A84C', fontWeight: 700 }}>{modalRefund.label}</span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(45,95,153,0.3)' }}>
                <span style={{ color: '#4A6888' }}>예상 환불액</span>
                <span className="font-black text-base" style={{ color: modalRefund.rate === 0 ? '#F87171' : '#4ADE80' }}>
                  {formatPrice(modalRefund.amount)}
                </span>
              </div>
            </div>

            {modalRefund.rate === 0 && (
              <p className="text-xs text-center font-semibold" style={{ color: '#F87171' }}>
                당일 취소는 환불이 되지 않습니다
              </p>
            )}

            <p className="text-xs text-center" style={{ color: '#4A6888' }}>
              취소 신청 후 관리자 검토를 거쳐 환불이 진행됩니다
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalBooking(null)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(45,95,153,0.2)', color: '#8A9BB0', border: '1px solid rgba(45,95,153,0.3)' }}
              >
                닫기
              </button>
              <button
                onClick={requestCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }}
              >
                {cancelling ? '신청 중...' : '취소 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: '#4A6888' }}>{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''} style={{ color: highlight ? '#C9A84C' : '#F8F9FA', fontWeight: highlight ? 700 : 600 }}>{value}</span>
    </div>
  )
}

function StatusBadge({ status, cancelStatus }: { status: string; cancelStatus?: string | null }) {
  if (cancelStatus === 'pending') return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}>취소검토중</span>
  if (cancelStatus === 'approved') return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}>취소승인</span>
  if (cancelStatus === 'rejected') return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>취소거절</span>
  const map: Record<string, { bg: string; color: string; label: string }> = {
    confirmed:     { bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C',  label: '예약확정' },
    pending:       { bg: 'rgba(96,165,250,0.15)',   color: '#60A5FA',  label: '입금대기' },
    visit_pending: { bg: 'rgba(251,191,36,0.15)',   color: '#FBBF24',  label: '방문예정' },
    cancelled:     { bg: 'rgba(248,113,113,0.15)',  color: '#F87171',  label: '취소됨' },
  }
  const s = map[status] ?? { bg: 'rgba(45,95,153,0.2)', color: '#4A6888', label: status }
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

export default function BookingLookupPage() {
  return (
    <Suspense fallback={
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    }>
      <LookupContent />
    </Suspense>
  )
}
