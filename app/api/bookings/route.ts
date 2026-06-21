import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendBookingConfirm, sendAdminNewBooking } from '@/lib/alimtalk'
import type { CartItem } from '@/types'

// POST /api/bookings - 예약 생성 (무통장/현장결제)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      customerName,
      customerPhone,
      busSeatNumber,
      boatSpotId,
      cartItems,
      totalAmount,
      paymentMethod,
      depositorName,
      notes,
    } = body

    if (!date || !customerName || !customerPhone || !paymentMethod) {
      return NextResponse.json({ error: '필수 정보가 누락됐습니다' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 좌석 중복 확인
    if (busSeatNumber) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('date', date)
        .eq('bus_seat_number', busSeatNumber)
        .neq('payment_status', 'cancelled')
        .single()

      if (existing) {
        return NextResponse.json({ error: '이미 예약된 좌석입니다' }, { status: 409 })
      }
    }

    if (boatSpotId) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('date', date)
        .eq('boat_spot_id', boatSpotId)
        .neq('payment_status', 'cancelled')
        .single()

      if (existing) {
        return NextResponse.json({ error: '이미 예약된 배 자리입니다' }, { status: 409 })
      }
    }

    // 예약 번호 생성
    const dateStr = date.replace(/-/g, '')
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .like('booking_number', `B${dateStr}%`)

    const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
    const bookingNumber = `B${dateStr}${seq}`

    // 예약 생성
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        date,
        customer_name: customerName,
        customer_phone: customerPhone,
        bus_seat_number: busSeatNumber ?? null,
        boat_spot_id: boatSpotId ?? null,
        payment_method: paymentMethod,
        payment_status: 'pending',
        total_amount: totalAmount,
        depositor_name: depositorName ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('예약 생성 오류:', bookingError)
      return NextResponse.json({ error: '예약 생성에 실패했습니다' }, { status: 500 })
    }

    // 상품 주문 생성
    if (cartItems && cartItems.length > 0) {
      const orders = cartItems.map((item: CartItem) => ({
        booking_id: booking.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))

      await supabase.from('product_orders').insert(orders)
    }

    // 현장결제는 visit_pending (방문예정)
    if (paymentMethod === 'onsite') {
      await supabase
        .from('bookings')
        .update({ payment_status: 'visit_pending' })
        .eq('id', booking.id)
      booking.payment_status = 'visit_pending'
    }

    // 알림톡 발송 (비동기 - 실패해도 예약은 완료)
    try {
      await sendBookingConfirm(booking)
      await sendAdminNewBooking(booking)
    } catch (err) {
      console.error('알림톡 발송 실패:', err)
    }

    return NextResponse.json({ id: booking.id, booking_number: bookingNumber })
  } catch (err) {
    console.error('예약 API 오류:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// GET /api/bookings?id=[bookingId]
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, product_orders(*, product:products(*))`)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json(data)
}
