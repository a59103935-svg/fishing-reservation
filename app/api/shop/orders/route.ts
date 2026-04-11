import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/shop/orders?name=홍길동&phone=010-0000-0000
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name  = searchParams.get('name')?.trim()
  const phone = searchParams.get('phone')?.trim()

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 연락처를 입력해 주세요' }, { status: 400 })
  }

  const db = adminClient()
  const { data, error } = await db
    .from('shop_orders')
    .select('*, product:product_id(id, name, image_url, category)')
    .eq('name', name)
    .eq('phone', phone)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// PATCH /api/shop/orders  { id, name, phone }
export async function PATCH(request: NextRequest) {
  let body: { id?: string; name?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const { id, name, phone } = body
  if (!id || !name || !phone) {
    return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 })
  }

  const db = adminClient()

  // Verify ownership before cancelling
  const { data: existing } = await db
    .from('shop_orders')
    .select('id, status')
    .eq('id', id)
    .eq('name', name.trim())
    .eq('phone', phone.trim())
    .single()

  if (!existing) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
  }
  if (existing.status === 'cancelled') {
    return NextResponse.json({ error: '이미 취소된 주문입니다' }, { status: 400 })
  }

  const { error } = await db
    .from('shop_orders')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
