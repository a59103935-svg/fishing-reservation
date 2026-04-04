import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types'

// POST /api/payments/naver - 네이버페이 결제 준비
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
    } = body

    if (!date || !customerName || !customerPhone || !totalAmount) {
      return NextResponse.json({ error: '필수 정보가 누락됐습니다' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

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

    // 임시 예약 생성
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
      })
      .select()
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: '예약 생성에 실패했습니다' }, { status: 500 })
    }

    // 상품 주문
    if (cartItems && cartItems.length > 0) {
      const orders = cartItems.map((item: CartItem) => ({
        booking_id: booking.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))
      await supabase.from('product_orders').insert(orders)
    }

    // 네이버페이 결제창 URL 구성
    // 실제 네이버페이는 SDK를 통한 클라이언트 사이드 연동 필요
    // 여기서는 네이버페이 파라미터를 반환하여 클라이언트에서 처리
    const naverPayParams = new URLSearchParams({
      merchantPayKey: bookingNumber,
      productName: `낚시 출조 예약 (${date})`,
      totalPayAmount: String(totalAmount),
      taxScopeAmount: String(totalAmount),
      taxExScopeAmount: '0',
      returnUrl: `${baseUrl}/api/payments/naver/callback?booking_id=${booking.id}`,
    })

    const partnerId = process.env.NAVERPAY_PARTNER_ID ?? ''
    const chainId = process.env.NAVERPAY_CHAIN_ID ?? ''

    // 네이버페이 결제창 URL (실제 환경)
    const naverPayUrl = `https://pay.naver.com/payments/new?partnerId=${partnerId}&chainId=${chainId}&${naverPayParams.toString()}`

    return NextResponse.json({
      redirect_url: naverPayUrl,
      booking_id: booking.id,
      merchant_pay_key: bookingNumber,
    })
  } catch (err) {
    console.error('네이버페이 준비 오류:', err)
    return NextResponse.json({ error: '네이버페이 연결에 실패했습니다' }, { status: 500 })
  }
}

// GET /api/payments/naver/callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('booking_id')
  const paymentId = searchParams.get('paymentId')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  if (!bookingId || !paymentId) {
    return NextResponse.redirect(`${baseUrl}/checkout?failed=true`)
  }

  try {
    const supabase = createServiceClient()

    // 결제 확인 후 업데이트
    await supabase
      .from('bookings')
      .update({
        payment_status: 'confirmed',
        pg_tid: paymentId,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    return NextResponse.redirect(`${baseUrl}/confirmation/${bookingId}`)
  } catch (err) {
    console.error('네이버페이 콜백 오류:', err)
    return NextResponse.redirect(`${baseUrl}/checkout?failed=true`)
  }
}
