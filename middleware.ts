import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/booking/lookup')) {
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

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (pathname.startsWith('/admin')) {
    if (!user || user.id !== ADMIN_USER_ID) {
      return NextResponse.redirect(new URL('/notices', request.url))
    }
    return response
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user.id === ADMIN_USER_ID) {
    return response
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.nickname) {
    return NextResponse.redirect(new URL('/set-nickname', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/booking/:path*',
  ],
}
