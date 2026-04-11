import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sendBookingConfirm, sendBookingCancelled } from '@/lib/alimtalk'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/admin/bookings?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[admin/bookings GET] auth error:', authError)
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  if (adminId && user.id !== adminId) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')

  const db = adminClient()
  let query = db
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (date) {
    query = query.eq('date', date)
  } else {
    // 전체 조회 시 오늘(KST) 이후 예약만
    const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    query = query.gte('date', todayKST)
  }
  if (status) query = query.eq('payment_status', status)

  const { data, error } = await query

  if (error) {
    console.error('[admin/bookings GET] query error:', error)
    return NextResponse.json({ error: '조회 실패', detail: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// PATCH /api/admin/bookings - 상태 변경
export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  let body: { bookingId?: string; action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 })
  }
  const { bookingId, action } = body

  if (!bookingId || !action) {
    return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
  }

  const db = adminClient()

  if (action === 'confirm') {
    console.log('[PATCH confirm] bookingId:', bookingId)
    const { data, error } = await db
      .from('bookings')
      .update({ payment_status: 'confirmed' })
      .eq('id', bookingId)
      .select()

    if (error) {
      console.error('[PATCH confirm] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: '해당 예약을 찾을 수 없습니다' }, { status: 404 })
    }

    try { await sendBookingConfirm(data[0]) } catch (err) { console.error('알림톡 발송 실패:', err) }
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    console.log('[PATCH cancel] bookingId:', bookingId)

    const { error } = await db
      .from('bookings')
      .update({ payment_status: 'cancelled' })
      .eq('id', bookingId)

    console.log('[PATCH cancel] error:', error)

    if (error) {
      console.error('[PATCH cancel] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'cancel_approve') {
    const { data, error } = await db
      .from('bookings')
      .update({ payment_status: 'cancelled' })
      .eq('id', bookingId)
      .select()

    if (error) {
      console.error('[PATCH cancel_approve] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try { await sendBookingCancelled(data?.[0]) } catch (err) { console.error('알림톡 발송 실패:', err) }
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel_reject') {
    const { error } = await db
      .from('bookings')
      .update({ payment_status: 'pending' })
      .eq('id', bookingId)

    if (error) {
      console.error('[PATCH cancel_reject] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 })
}

// DELETE /api/admin/bookings - 예약 삭제
export async function DELETE(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('id')

  if (!bookingId) {
    return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 })
  }

  const { error } = await adminClient()
    .from('bookings')
    .delete()
    .eq('id', bookingId)

  if (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
