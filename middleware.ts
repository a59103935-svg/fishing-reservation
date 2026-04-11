import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const EXCLUDED = ['/set-nickname', '/login', '/auth', '/api/']
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (EXCLUDED.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /admin 경로: 어드민 유저만 접근 허용
  if (pathname.startsWith('/admin')) {
    if (!user || user.id !== ADMIN_USER_ID) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // 일반 유저: 닉네임 없으면 /set-nickname으로
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.nickname) {
      return NextResponse.redirect(new URL('/set-nickname', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
