import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single()

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
