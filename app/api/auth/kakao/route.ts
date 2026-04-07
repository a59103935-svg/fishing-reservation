import { NextRequest, NextResponse } from 'next/server'

const REST_API_KEY = 'ac1b77e9c91483137d68c5448e932b4e'

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json()
    if (!code || !redirectUri) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 })
    }

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        redirect_uri: redirectUri,
        code,
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error_description ?? tokenData.error }, { status: 400 })
    }

    return NextResponse.json({ id_token: tokenData.id_token ?? null, access_token: tokenData.access_token })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
