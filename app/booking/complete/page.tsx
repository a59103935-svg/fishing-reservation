'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateKorean, formatPrice, getPaymentMethodLabel } from '@/lib/booking'
import type { Booking } from '@/types'

function BookingComplete() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const bookingId = searchParams.get('booking_id')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setError('예약 정보를 찾을 수 없습니다')
      setLoading(false)
      return
    }
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (err || !data) {
        setError('예약 정보를 찾을 수 없습니다')
      } else {
        setBooking(data)
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId, supabase])

  useEffect(() => {
    loadBooking()
  }, [loadBooking])

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
          <button className="mt-6 btn-primary" onClick={() => router.push('/')}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const isBankTransfer = (booking.payment_method as string) === 'bank_transfer' || (booking.payment_method as string) === 'bank'
  const isOnsite = booking.payment_method === 'onsite'

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 text-white px-4 pt-12 pb-8 text-center">
        <div className="text-5xl mb-3">🎣</div>
        <h1 className="text-2xl font-bold mb-1">예약이 완료됐어요!</h1>
        <p className="text-blue-200 text-sm">
          {isBankTransfer
            ? '입금 후 확정 알림톡을 보내드릴게요 😊'
            : '당일 즐거운 조행 되세요! 🐟'}
        </p>
        <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
          <p className="text-xs text-blue-200">예약번호</p>
          <p className="text-2xl font-black tracking-wider">{booking.booking_number}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 예약 요약 */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3 text-base">예약 정보</h2>
          <div className="space-y-2.5 text-sm">
            <Row label="출조일" value={formatDateKorean(booking.date)} />
            {booking.bus_seat_number && (
              <Row label="버스 좌석번호" value={`${booking.bus_seat_number}번석`} />
            )}
            {booking.boat_spot_id && (
              <Row label="배 자리번호" value={booking.boat_spot_id} />
            )}
            <Row label="결제방법" value={getPaymentMethodLabel(booking.payment_method)} />
            <div className="flex justify-between pt-1 border-t border-gray-100 mt-1">
              <span className="font-bold text-gray-800">총 결제 금액</span>
              <span className="text-lg font-black text-blue-600">
                {formatPrice(booking.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* 무통장 입금 안내 */}
        {isBankTransfer && (
          <div className="card border-yellow-200 bg-yellow-50">
            <h3 className="font-bold text-yellow-800 mb-2">💳 입금 안내</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>
                아래 계좌로 <strong>{formatPrice(booking.total_amount)}</strong>를 입금해 주세요.
              </p>
              <div className="mt-2 bg-yellow-100 rounded-xl px-4 py-3">
                <p className="font-bold text-base">신한은행 110-412-245177</p>
                <p className="text-yellow-700 text-xs mt-0.5">예금주: 강현구</p>
              </div>
              <p className="mt-2 text-xs text-yellow-700">
                ⏰ 입금기한: 예약 후 <strong>24시간 이내</strong> (미입금 시 자동 취소)
              </p>
              {booking.depositor_name && (
                <p className="text-xs text-yellow-700">
                  입금자명: <strong>{booking.depositor_name}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* 현장 결제 안내 */}
        {isOnsite && (
          <div className="card border-green-200 bg-green-50">
            <h3 className="font-bold text-green-800 mb-2">🏕 현장 결제 안내</h3>
            <p className="text-sm text-green-800">
              당일 출발 전 현장에서 결제해 주세요. 출발 <strong>30분 전</strong>까지 도착 부탁드립니다.
            </p>
          </div>
        )}

        {/* 홈 버튼 */}
        <button className="btn-primary" onClick={() => router.push('/')}>
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default function BookingCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingComplete />
    </Suspense>
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
