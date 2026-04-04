'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import {
  formatPrice,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  formatDateKorean,
} from '@/lib/booking'
import type { Booking, PaymentStatus } from '@/types'

type FilterStatus = 'all' | PaymentStatus

export default function ReservationsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [blockInput, setBlockInput] = useState({ seatType: 'bus', seatId: '', reason: '' })

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select(`*, product_orders(*, product:products(*))`)
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

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  async function confirmBooking(bookingId: string) {
    await supabase
      .from('bookings')
      .update({ payment_status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', bookingId)
    loadBookings()
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm('정말 이 예약을 취소하시겠습니까?')) return
    await supabase
      .from('bookings')
      .update({ payment_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)
    loadBookings()
  }

  async function blockSeat() {
    if (!blockInput.seatId.trim()) {
      alert('좌석 번호를 입력해 주세요')
      return
    }
    const { error } = await supabase.from('seat_blocks').upsert({
      date: dateFilter,
      seat_type: blockInput.seatType,
      seat_id: blockInput.seatId.trim(),
      reason: blockInput.reason.trim() || null,
    })
    if (error) {
      alert('이미 차단된 좌석입니다')
    } else {
      alert('좌석이 차단됐습니다')
      setBlockInput({ seatType: 'bus', seatId: '', reason: '' })
    }
  }

  async function unblockSeat() {
    if (!blockInput.seatId.trim()) {
      alert('좌석 번호를 입력해 주세요')
      return
    }
    await supabase
      .from('seat_blocks')
      .delete()
      .eq('date', dateFilter)
      .eq('seat_type', blockInput.seatType)
      .eq('seat_id', blockInput.seatId.trim())
    alert('차단이 해제됐습니다')
    setBlockInput({ seatType: 'bus', seatId: '', reason: '' })
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.payment_status === 'confirmed').length,
    pending: bookings.filter((b) => b.payment_status === 'pending').length,
    visit_pending: bookings.filter((b) => b.payment_status === 'visit_pending').length,
    cancelled: bookings.filter((b) => b.payment_status === 'cancelled').length,
    revenue: bookings
      .filter((b) => b.payment_status === 'confirmed')
      .reduce((s, b) => s + b.total_amount, 0),
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">예약 관리</h1>

      {/* 필터 */}
      <div className="card space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">날짜</label>
          <input
            type="date"
            className="form-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">상태 필터</label>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'confirmed', 'pending', 'visit_pending', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? '전체' : getPaymentStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-black text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500">전체 예약</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-black text-green-600">{stats.confirmed}</p>
          <p className="text-xs text-gray-500">확정</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-black text-yellow-500">{stats.pending}</p>
          <p className="text-xs text-gray-500">입금대기</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-black text-blue-600">
            {stats.revenue > 0 ? `${(stats.revenue / 10000).toFixed(0)}만원` : '0원'}
          </p>
          <p className="text-xs text-gray-500">확정 매출</p>
        </div>
      </div>

      {/* 예약 목록 */}
      <div className="card">
        <h2 className="font-bold text-gray-800 mb-3">
          {format(new Date(dateFilter), 'M월 d일 (E)', { locale: ko })} 예약 ({bookings.length}건)
        </h2>

        {loading ? (
          <div className="py-8 text-center text-gray-400">불러오는 중...</div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-gray-400">예약이 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-3 text-xs font-semibold text-gray-500">예약번호</th>
                  <th className="py-2 pr-3 text-xs font-semibold text-gray-500">이름</th>
                  <th className="py-2 pr-3 text-xs font-semibold text-gray-500">연락처</th>
                  <th className="py-2 pr-3 text-xs font-semibold text-gray-500">좌석</th>
                  <th className="py-2 pr-3 text-xs font-semibold text-gray-500">결제</th>
                  <th className="py-2 pr-3 text-xs font-semibold text-gray-500">금액</th>
                  <th className="py-2 text-xs font-semibold text-gray-500">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-mono text-xs">{b.booking_number}</td>
                    <td className="py-2.5 pr-3 font-semibold">{b.customer_name}</td>
                    <td className="py-2.5 pr-3 text-gray-600">{b.customer_phone}</td>
                    <td className="py-2.5 pr-3">
                      <div className="text-xs">
                        {b.bus_seat_number && <span>버스 {b.bus_seat_number}번</span>}
                        {b.boat_spot_id && <span className="block">배 {b.boat_spot_id}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="text-xs">
                        <div>{getPaymentMethodLabel(b.payment_method)}</div>
                        <div>
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                            b.payment_status === 'confirmed'     ? 'bg-green-100 text-green-700' :
                            b.payment_status === 'visit_pending' ? 'bg-yellow-100 text-yellow-700' :
                            b.payment_status === 'pending'       ? 'bg-blue-100 text-blue-700' :
                            b.payment_status === 'cancelled'     ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {getPaymentStatusLabel(b.payment_status)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 font-bold">{(b.total_amount / 10000).toFixed(1)}만</td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        {(b.payment_status === 'pending' || b.payment_status === 'visit_pending') && (
                          <button
                            className="bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-semibold hover:bg-green-600 active:scale-95 transition-all whitespace-nowrap"
                            onClick={() => confirmBooking(b.id)}
                          >
                            확정
                          </button>
                        )}
                        {b.payment_status !== 'cancelled' && (
                          <button
                            className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-lg font-semibold hover:bg-red-200 active:scale-95 transition-all"
                            onClick={() => cancelBooking(b.id)}
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 좌석 차단 */}
      <div className="card">
        <h2 className="font-bold text-gray-800 mb-3">좌석 수동 차단 / 오픈</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              좌석 종류
            </label>
            <select
              className="form-input"
              value={blockInput.seatType}
              onChange={(e) => setBlockInput({ ...blockInput, seatType: e.target.value })}
            >
              <option value="bus">버스 (숫자 입력: 1~30)</option>
              <option value="boat">배 (예: L1, R3, F5, B2)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              좌석 번호/ID
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={blockInput.seatType === 'bus' ? '예: 5' : '예: L3'}
              value={blockInput.seatId}
              onChange={(e) => setBlockInput({ ...blockInput, seatId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              차단 사유 (선택)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 고장, 관계자 전용"
              value={blockInput.reason}
              onChange={(e) => setBlockInput({ ...blockInput, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 active:scale-95 transition-all"
              onClick={blockSeat}
            >
              차단하기
            </button>
            <button
              className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 active:scale-95 transition-all"
              onClick={unblockSeat}
            >
              차단 해제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
