import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { readyPayment } from '@/lib/payments/kakao'
import type { CartItem } from '@/types'

// POST /api/payments/kakao - 카카오페이 결제 준비
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
    } = body

    if (!date || !customerName || !customerPhone || !totalAmount) {
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

    // 예약번호 생성
    const dateStr = date.replace(/-/g, '')
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .like('booking_number', `B${dateStr}%`)
    const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
    const bookingNumber = `B${dateStr}${seq}`

    // 임시 예약 생성 (pending)
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
      })
      .select()
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: '예약 생성에 실패했습니다' }, { status: 500 })
    }

    // 상품 주문 임시 생성
    if (cartItems && cartItems.length > 0) {
      const orders = cartItems.map((item: CartItem) => ({
        booking_id: booking.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))
      await supabase.from('product_orders').insert(orders)
    }

    // 상품명 구성
    const itemName = busSeatNumber
      ? `낚시 출조 버스 ${busSeatNumber}번석 (${date})`
      : `낚시 출조 예약 (${date})`

    // 카카오페이 결제 준비
    const kakaoReady = await readyPayment({
      orderId: bookingNumber,
      userId: customerPhone.replace(/-/g, ''),
      itemName,
      quantity: 1,
      totalAmount,
    })

    // tid 저장
    await supabase
      .from('bookings')
      .update({ pg_tid: kakaoReady.tid })
      .eq('id', booking.id)

    return NextResponse.json({
      redirect_url: kakaoReady.next_redirect_mobile_url,
      pc_url: kakaoReady.next_redirect_pc_url,
      booking_id: booking.id,
      tid: kakaoReady.tid,
    })
  } catch (err) {
    console.error('카카오페이 준비 오류:', err)
    return NextResponse.json({ error: '카카오페이 연결에 실패했습니다' }, { status: 500 })
  }
}
