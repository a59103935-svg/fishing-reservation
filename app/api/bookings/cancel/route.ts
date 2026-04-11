import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/bookings/cancel — 취소 신청
export async function POST(req: NextRequest) {
  try {
    const { booking_id, refund_amount, refund_rate } = await req.json()

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id가 필요합니다' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 기존 예약 확인
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, payment_status, cancel_status')
      .eq('id', booking_id)
      .single()

    if (fetchErr) {
      console.error('[cancel] fetch error:', fetchErr)
      return NextResponse.json({ error: fetchErr.message, code: fetchErr.code }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
    }

    if (booking.payment_status === 'cancelled') {
      return NextResponse.json({ error: '이미 취소된 예약입니다' }, { status: 400 })
    }

    if (booking.cancel_status) {
      return NextResponse.json({ error: '이미 취소 신청이 접수된 예약입니다' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        cancel_requested_at: new Date().toISOString(),
        cancel_status: 'pending',
        refund_amount: refund_amount ?? 0,
      })
      .eq('id', booking_id)

    if (updateErr) {
      console.error('[cancel] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, refund_rate, refund_amount })
  } catch (err) {
    console.error('[cancel] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
