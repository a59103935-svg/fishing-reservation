'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBookingStore } from '@/lib/store'
import {
  formatDateKorean,
  formatPrice,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/lib/booking'
import type { Booking } from '@/types'

export default function ConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const bookingId = params.bookingId as string
  const { clearAll } = useBookingStore()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBooking = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select(`
          *,
          product_orders (
            *,
            product:products (*)
          )
        `)
        .eq('id', bookingId)
        .single()

      if (err || !data) {
        setError('예약 정보를 찾을 수 없습니다')
      } else {
        setBooking(data)
        clearAll()
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId, supabase, clearAll])

  useEffect(() => {
    loadBooking()
  }, [loadBooking])

  function getStatusBadge(status: string) {
    if (status === 'confirmed')
      return <span className="badge-confirmed">✓ 예약완료</span>
    if (status === 'pending') {
      if (booking?.payment_method === 'bank')
        return <span className="badge-pending">⏳ 입금확인중</span>
      if (booking?.payment_method === 'onsite')
        return <span className="badge-pending">🏕 현장결제예약</span>
      return <span className="badge-pending">⏳ 처리중</span>
    }
    return <span className="badge-cancelled">✗ 취소됨</span>
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">😢</p>
          <p className="text-gray-600 font-semibold">{error || '예약 정보를 찾을 수 없습니다'}</p>
          <button
            className="mt-6 btn-primary"
            onClick={() => router.push('/')}
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 pb-8">
      {/* 성공 헤더 */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 text-white px-4 pt-12 pb-8 text-center">
        <div className="text-5xl mb-3">
          {booking.payment_status === 'confirmed' ? '✅' : '📋'}
        </div>
        <h1 className="text-2xl font-bold mb-1">
          {booking.payment_status === 'confirmed'
            ? '예약이 완료됐습니다!'
            : booking.payment_method === 'bank'
            ? '입금을 확인 중입니다'
            : '예약이 접수됐습니다!'}
        </h1>
        <p className="text-blue-200 text-sm">
          {booking.payment_method === 'bank'
            ? '입금 확인 후 예약이 확정됩니다'
            : booking.payment_method === 'onsite'
            ? '출발 30분 전까지 도착해 주세요'
            : '예약 확정 알림톡을 확인하세요'}
        </p>

        {/* 예약 번호 */}
        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-blue-200">예약번호</p>
          <p className="text-2xl font-black tracking-wider">{booking.booking_number}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 상태 배지 */}
        <div className="card flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">예약 상태</span>
          {getStatusBadge(booking.payment_status)}
        </div>

        {/* 예약 상세 */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3 text-base">예약 상세</h2>
          <div className="space-y-2.5 text-sm">
            <Row label="출조일" value={formatDateKorean(booking.date)} />
            <Row label="이름" value={booking.customer_name} />
            <Row label="연락처" value={booking.customer_phone} />
            {booking.bus_seat_number && (
              <Row label="버스 좌석" value={`${booking.bus_seat_number}번석`} />
            )}
            {booking.boat_spot_id && (
              <Row label="배 자리" value={booking.boat_spot_id} />
            )}
            <Row label="결제 수단" value={getPaymentMethodLabel(booking.payment_method)} />
            {booking.depositor_name && (
              <Row label="입금자명" value={booking.depositor_name} />
            )}
          </div>
        </div>

        {/* 낚시용품 */}
        {booking.product_orders && booking.product_orders.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-3 text-base">낚시용품</h2>
            <div className="space-y-2">
              {booking.product_orders.map((order) => (
                <div key={order.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {order.product?.name} × {order.quantity}
                  </span>
                  <span className="font-semibold">
                    {(order.unit_price * order.quantity).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 결제 금액 */}
        <div className="card">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800">총 결제 금액</span>
            <span className="text-xl font-black text-blue-600">
              {formatPrice(booking.total_amount)}
            </span>
          </div>
        </div>

        {/* 무통장 안내 */}
        {booking.payment_method === 'bank' && booking.payment_status === 'pending' && (
          <div className="card border-yellow-200 bg-yellow-50">
            <h3 className="font-bold text-yellow-800 mb-2">📢 입금 안내</h3>
            <p className="text-sm text-yellow-800">
              예약번호 <strong>{booking.booking_number}</strong>를 입금자명에 포함하거나
              {booking.depositor_name && ` "${booking.depositor_name}" 으로`} 입금해 주세요.
              입금 확인 후 카카오 알림톡으로 안내드립니다.
            </p>
          </div>
        )}

        {/* 안내 */}
        <div className="card bg-blue-50 border-blue-100">
          <p className="text-sm font-semibold text-blue-800 mb-1">예약 안내</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 이 화면을 스크린샷으로 저장해 두세요</li>
            <li>• 취소는 출조 2일 전까지 100% 환불</li>
            <li>• 출발 30분 전까지 승차 부탁드립니다</li>
            <li>• 문의: 예약번호와 함께 전화 주세요</li>
          </ul>
        </div>

        {/* 홈 버튼 */}
        <button
          className="btn-primary"
          onClick={() => router.push('/')}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  )
}
