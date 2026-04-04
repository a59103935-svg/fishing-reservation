import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { approvePayment } from '@/lib/payments/kakao'
import { sendBookingConfirm, sendAdminNewBooking } from '@/lib/alimtalk'

// GET /api/payments/kakao/callback - 카카오페이 결제 승인 콜백
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pgToken = searchParams.get('pg_token')
  const orderId = searchParams.get('order_id') // booking_number

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  if (!pgToken || !orderId) {
    return NextResponse.redirect(`${baseUrl}/checkout?failed=true`)
  }

  try {
    const supabase = createServiceClient()

    // booking 조회
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_number', orderId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.redirect(`${baseUrl}/checkout?failed=true`)
    }

    // 카카오페이 승인
    const approveResult = await approvePayment({
      tid: booking.pg_tid,
      orderId: booking.booking_number,
      userId: booking.customer_phone.replace(/-/g, ''),
      pgToken,
    })

    // 예약 confirmed 업데이트
    await supabase
      .from('bookings')
      .update({
        payment_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    booking.payment_status = 'confirmed'

    // 알림톡 발송
    try {
      await sendBookingConfirm(booking)
      await sendAdminNewBooking(booking)
    } catch (err) {
      console.error('알림톡 발송 실패:', err)
    }

    // 예약 완료 페이지로 리다이렉트
    return NextResponse.redirect(`${baseUrl}/confirmation/${booking.id}`)
  } catch (err) {
    console.error('카카오페이 승인 오류:', err)
    return NextResponse.redirect(`${baseUrl}/checkout?failed=true`)
  }
}
