'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import {
  formatPrice,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/lib/booking'
import type { Booking, PaymentStatus } from '@/types'

type FilterStatus = 'all' | PaymentStatus

export default function ReservationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [blockInput, setBlockInput] = useState({ seatType: 'bus', seatId: '', reason: '' })

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('date', dateFilter)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter)
      }

      const { data } = await query
      setBookings(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [supabase, dateFilter, statusFilter])

  useEffect(() => { loadBookings() }, [loadBookings])

  async function confirmBooking(bookingId: string) {
    await supabase.from('bookings').update({ payment_status: 'confirmed' }).eq('id', bookingId)
    loadBookings()
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm('정말 이 예약을 취소하시겠습니까?')) return
    await supabase.from('bookings').update({ payment_status: 'cancelled' }).eq('id', bookingId)
    loadBookings()
  }

  async function blockSeat() {
    if (!blockInput.seatId.trim()) { alert('좌석 번호를 입력해 주세요'); return }
    const { error } = await supabase.from('seat_blocks').upsert({
      date: dateFilter,
      seat_type: blockInput.seatType,
      seat_id: blockInput.seatId.trim(),
      reason: blockInput.reason.trim() || null,
    })
    if (error) { alert('이미 차단된 좌석입니다') }
    else { alert('좌석이 차단됐습니다'); setBlockInput({ seatType: 'bus', seatId: '', reason: '' }) }
  }

  async function unblockSeat() {
    if (!blockInput.seatId.trim()) { alert('좌석 번호를 입력해 주세요'); return }
    await supabase.from('seat_blocks').delete()
      .eq('date', dateFilter).eq('seat_type', blockInput.seatType).eq('seat_id', blockInput.seatId.trim())
    alert('차단이 해제됐습니다')
    setBlockInput({ seatType: 'bus', seatId: '', reason: '' })
  }

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter((b) => b.payment_status === 'confirmed').length,
    pending:   bookings.filter((b) => b.payment_status === 'pending').length,
    revenue:   bookings.filter((b) => b.payment_status === 'confirmed').reduce((s, b) => s + b.total_amount, 0),
  }

  const inputStyle = {
    background: 'rgba(13,31,53,0.8)',
    border: '1px solid rgba(45,95,153,0.5)',
    color: '#F8F9FA',
    borderRadius: '12px',
    padding: '8px 12px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle = { color: '#C9A84C', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }

  return (
    <div className="px-4 py-6 space-y-5" style={{ background: '#0D1F35', minHeight: '100vh' }}>
      <h1 className="text-2xl font-black" style={{ color: '#C9A84C' }}>예약 관리</h1>

      {/* 필터 */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div>
          <label style={labelStyle}>날짜</label>
          <input type="date" style={inputStyle} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>상태 필터</label>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'confirmed', 'pending', 'visit_pending', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: statusFilter === s ? 'rgba(201,168,76,0.2)' : 'rgba(45,95,153,0.2)',
                  color: statusFilter === s ? '#C9A84C' : '#4A6888',
                  border: `1px solid ${statusFilter === s ? 'rgba(201,168,76,0.4)' : 'rgba(45,95,153,0.3)'}`,
                }}
              >
                {s === 'all' ? '전체' : getPaymentStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '전체 예약', value: stats.total, color: '#F8F9FA' },
          { label: '확정', value: stats.confirmed, color: '#4ADE80' },
          { label: '입금대기', value: stats.pending, color: '#FBBF24' },
          { label: '확정 매출', value: stats.revenue > 0 ? `${(stats.revenue / 10000).toFixed(0)}만원` : '0원', color: '#C9A84C' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#C9A84C' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* 예약 목록 */}
      <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
        <h2 className="font-bold mb-3" style={{ color: '#C9A84C' }}>
          {format(new Date(dateFilter), 'M월 d일 (E)', { locale: ko })} 예약 ({bookings.length}건)
        </h2>

        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: '#4A6888' }}>불러오는 중...</div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: '#4A6888' }}>예약이 없습니다</div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => {
              const isCancelled = b.payment_status === 'cancelled'
              const isConfirmed = b.payment_status === 'confirmed'
              return (
                <div
                  key={b.id}
                  className="rounded-xl p-3"
                  style={{
                    background: isCancelled ? 'rgba(30,30,40,0.5)' : isConfirmed ? 'rgba(201,168,76,0.07)' : 'rgba(45,95,153,0.15)',
                    border: `1px solid ${isCancelled ? 'rgba(80,80,100,0.3)' : isConfirmed ? 'rgba(201,168,76,0.3)' : 'rgba(45,95,153,0.3)'}`,
                    opacity: isCancelled ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: '#F8F9FA' }}>{b.customer_name}</span>
                        <span className="text-xs" style={{ color: '#4A6888' }}>{b.customer_phone}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: isConfirmed ? 'rgba(74,222,128,0.15)' : isCancelled ? 'rgba(80,80,100,0.3)' : 'rgba(251,191,36,0.15)',
                            color: isConfirmed ? '#4ADE80' : isCancelled ? '#6B7280' : '#FBBF24',
                          }}
                        >
                          {getPaymentStatusLabel(b.payment_status)}
                        </span>
                      </div>
                      <p className="text-xs font-mono mt-0.5" style={{ color: '#3A5A7A' }}>{b.booking_number}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {b.bus_seat_number && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}>
                            버스 {b.bus_seat_number}번석
                          </span>
                        )}
                        {b.boat_spot_id && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.1)', color: '#67E8F9' }}>
                            배 {b.boat_spot_id}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,95,153,0.2)', color: '#8A9BB0' }}>
                          {getPaymentMethodLabel(b.payment_method)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: '#C9A84C' }}>{formatPrice(b.total_amount)}</p>
                      {!isCancelled && (
                        <div className="flex gap-1 mt-1.5 justify-end">
                          {(b.payment_status === 'pending' || b.payment_status === 'visit_pending') && (
                            <button
                              className="text-xs px-2.5 py-1 rounded-lg font-bold"
                              style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}
                              onClick={() => confirmBooking(b.id)}
                            >
                              확정
                            </button>
                          )}
                          <button
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
                            onClick={() => cancelBooking(b.id)}
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 좌석 차단 */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
        <h2 className="font-bold" style={{ color: '#C9A84C' }}>좌석 수동 차단 / 오픈</h2>
        <div>
          <label style={labelStyle}>좌석 종류</label>
          <select style={inputStyle} value={blockInput.seatType} onChange={(e) => setBlockInput({ ...blockInput, seatType: e.target.value })}>
            <option value="bus">버스 (숫자 입력: 1~30)</option>
            <option value="boat">배 (예: L1, R3, F5, B2)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>좌석 번호/ID</label>
          <input
            type="text"
            style={inputStyle}
            placeholder={blockInput.seatType === 'bus' ? '예: 5' : '예: L3'}
            value={blockInput.seatId}
            onChange={(e) => setBlockInput({ ...blockInput, seatId: e.target.value })}
          />
        </div>
        <div>
          <label style={labelStyle}>차단 사유 (선택)</label>
          <input
            type="text"
            style={inputStyle}
            placeholder="예: 고장, 관계자 전용"
            value={blockInput.reason}
            onChange={(e) => setBlockInput({ ...blockInput, reason: e.target.value })}
          />
        </div>
        <div className="flex gap-3">
          <button
            className="flex-1 font-bold py-3 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }}
            onClick={blockSeat}
          >
            차단하기
          </button>
          <button
            className="flex-1 font-bold py-3 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}
            onClick={unblockSeat}
          >
            차단 해제
          </button>
        </div>
      </div>
    </div>
  )
}
