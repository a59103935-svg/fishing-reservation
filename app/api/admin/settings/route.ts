import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let query
    if (body.id) {
      query = supabaseAdmin
        .from('site_settings')
        .upsert(body, { onConflict: 'id' })
        .select()
        .single()
    } else {
      // 첫 실행: row가 없으면 insert, 있으면 기존 row를 update
      const { data: existing } = await supabaseAdmin
        .from('site_settings')
        .select('id')
        .single()

      if (existing?.id) {
        query = supabaseAdmin
          .from('site_settings')
          .upsert({ ...body, id: existing.id }, { onConflict: 'id' })
          .select()
          .single()
      } else {
        query = supabaseAdmin
          .from('site_settings')
          .insert(body)
          .select()
          .single()
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[admin/settings] upsert error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[admin/settings] unexpected error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
