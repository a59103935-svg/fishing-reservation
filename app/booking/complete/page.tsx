'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateKorean, formatPrice } from '@/lib/booking'
import type { Booking } from '@/types'

function BookingComplete() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const bookingId = searchParams.get('id')   // ← 'booking_id' → 'id' 버그 수정

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

  useEffect(() => { loadBooking() }, [loadBooking])

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center px-4" style={{ background: '#0D1F35' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">😢</p>
          <p className="text-sm font-semibold mb-6" style={{ color: '#4A6888' }}>{error || '예약 정보를 찾을 수 없습니다'}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: '#C9A84C', color: '#0D1F35' }}>홈으로</button>
        </div>
      </div>
    )
  }

  const isBank   = booking.payment_method === 'bank'
  const isOnsite = booking.payment_method === 'onsite'

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-12" style={{ background: '#0D1F35' }}>
      {/* 헤더 */}
      <div className="px-5 pt-14 pb-8 text-center" style={{ background: 'linear-gradient(160deg, #0D1F35 0%, #0a1a2e 100%)' }}>
        <p className="text-4xl mb-3">{isOnsite ? '📋' : '🎣'}</p>
        <h1 className="text-xl font-black mb-1" style={{ color: '#F8F9FA' }}>
          {isOnsite ? '방문예정 등록 완료!' : isBank ? '입금을 확인 중입니다' : '예약 완료!'}
        </h1>
        <p className="text-xs" style={{ color: '#4A6888' }}>
          {isBank ? '입금 확인 후 예약이 확정됩니다' : isOnsite ? '현장결제 — 선착순 배정입니다' : '즐거운 조행 되세요!'}
        </p>
        <div className="mt-5 inline-block px-6 py-3 rounded-2xl" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <p className="text-[10px] mb-0.5" style={{ color: '#C9A84C' }}>예약번호</p>
          <p className="text-xl font-black tracking-wider" style={{ color: '#F8F9FA' }}>{booking.booking_number}</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* 예약 정보 */}
        <section style={{ background: '#1E3F66', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>예약 정보</p>
          <div className="space-y-2 text-sm">
            <Row label="출조일" value={formatDateKorean(booking.date)} />
            {booking.bus_seat_number && <Row label="버스 좌석" value={`${booking.bus_seat_number}번석`} />}
            {booking.boat_spot_id    && <Row label="배 자리"   value={`${booking.boat_spot_id}`} />}
            <Row label="이름"   value={booking.customer_name} />
            <Row label="연락처" value={booking.customer_phone} />
            <div className="pt-2" style={{ borderTop: '1px solid rgba(45,95,153,0.3)' }}>
              <Row label="총 결제금액" value={formatPrice(booking.total_amount)} highlight />
            </div>
          </div>
        </section>

        {/* 무통장 입금 안내 */}
        {isBank && (
          <section style={{ background: 'rgba(201,168,76,0.06)', borderRadius: 20, border: '1px solid rgba(201,168,76,0.25)', padding: '16px 20px' }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>▣ 입금 안내</p>
            <div className="rounded-xl px-4 py-3 space-y-2 text-sm mb-2" style={{ background: 'rgba(13,31,53,0.6)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <div className="flex justify-between"><span style={{ color: '#4A6888' }}>은행</span><span style={{ color: '#F8F9FA', fontWeight: 600 }}>신한은행</span></div>
              <div className="flex justify-between"><span style={{ color: '#4A6888' }}>계좌번호</span><span style={{ color: '#C9A84C', fontWeight: 700 }}>110-412-245177</span></div>
              <div className="flex justify-between"><span style={{ color: '#4A6888' }}>예금주</span><span style={{ color: '#F8F9FA', fontWeight: 600 }}>강현구</span></div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(45,95,153,0.3)' }}>
                <span style={{ color: '#4A6888' }}>입금액</span>
                <span className="font-black" style={{ color: '#C9A84C' }}>{formatPrice(booking.total_amount)}</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: '#8A6A20' }}>* 입금 확인 후 예약이 확정됩니다 (최대 1시간 소요)</p>
          </section>
        )}

        {/* 현장결제(방문예정) 안내 */}
        {isOnsite && (
          <section style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 20, border: '1px solid rgba(201,168,76,0.35)', padding: '16px 20px' }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#C9A84C' }}>⚠ 방문예정 등록 안내</p>
            <p className="text-sm font-bold mb-2" style={{ color: '#C9A84C' }}>
              현장결제는 자리를 보장하지 않습니다.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#A88A30' }}>
              선착순 배정이며, 조기 마감 시 탑승이 어려울 수 있습니다. 출발 <span style={{ color: '#C9A84C', fontWeight: 700 }}>30분 전</span>까지 도착해 주세요.
            </p>
          </section>
        )}

        {/* 공통 안내 */}
        <section style={{ background: 'rgba(45,95,153,0.12)', borderRadius: 20, border: '1px solid rgba(45,95,153,0.3)', padding: '16px 20px' }}>
          <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#93B5D4' }}>예약 안내</p>
          <ul className="text-xs space-y-1" style={{ color: '#4A6888' }}>
            <li>• 이 화면을 스크린샷으로 저장해 두세요</li>
            <li>• 취소는 출조 하루 전까지 100% 환불</li>
            <li>• 출발 30분 전까지 집결지 도착 부탁드립니다</li>
            <li>• 문의: 010-5910-3935 (좋은피싱)</li>
          </ul>
        </section>

        <button onClick={() => router.push('/')} className="w-full py-4 rounded-xl font-bold text-base" style={{ background: '#C9A84C', color: '#0D1F35' }}>
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default function BookingCompletePage() {
  return (
    <Suspense fallback={
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    }>
      <BookingComplete />
    </Suspense>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: '#4A6888' }}>{label}</span>
      <span style={{ color: highlight ? '#C9A84C' : '#F8F9FA', fontWeight: highlight ? 700 : 600 }}>{value}</span>
    </div>
  )
}
