import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendBookingConfirm, sendBookingCancelled } from '@/lib/alimtalk'

// GET /api/admin/bookings?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  // 관리자 인증 확인
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')

  const serviceClient = createServiceClient()
  let query = serviceClient
    .from('bookings')
    .select(`*, product_orders(*, product:products(*))`)
    .order('created_at', { ascending: false })

  if (date) query = query.eq('date', date)
  if (status) query = query.eq('payment_status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// PATCH /api/admin/bookings - 상태 변경
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { bookingId, action } = body // action: 'confirm' | 'cancel'

  if (!bookingId || !action) {
    return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  if (action === 'confirm') {
    const { data, error } = await serviceClient
      .from('bookings')
      .update({
        payment_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
    }

    try {
      await sendBookingConfirm(data)
    } catch (err) {
      console.error('알림톡 발송 실패:', err)
    }

    return NextResponse.json({ success: true, booking: data })
  }

  if (action === 'cancel') {
    const { data, error } = await serviceClient
      .from('bookings')
      .update({
        payment_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
    }

    try {
      await sendBookingCancelled(data)
    } catch (err) {
      console.error('알림톡 발송 실패:', err)
    }

    return NextResponse.json({ success: true, booking: data })
  }

  return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 })
}

// DELETE /api/admin/bookings - 예약 삭제
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('id')

  if (!bookingId) {
    return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('bookings')
    .delete()
    .eq('id', bookingId)

  if (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
