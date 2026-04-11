'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const HIDDEN_PREFIXES = ['/booking/', '/admin', '/confirmation', '/checkout', '/login', '/auth/']

const NAV_LINKS = [
  { href: '/notices',        label: '공지사항' },
  { href: '/shop',           label: '낚시용품' },
  { href: '/catch',          label: '조황게시판' },
  { href: '/booking/lookup', label: '예약조회' },
]

export default function TopTabBar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function fetchNickname(userId: string) {
    const { data } = await supabase.from('profiles').select('nickname').eq('id', userId).maybeSingle()
    setNickname(data?.nickname ?? null)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchNickname(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchNickname(session.user.id)
      else setNickname(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setMobileOpen(false)
  }

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const displayName = nickname ?? '회원'
  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] transition-all duration-300" style={{ background: scrolled ? 'rgba(13,31,53,0.92)' : '#0D1F35', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <Link href="/" className="font-display font-bold text-xl tracking-wide justify-self-start" style={{ color: '#C9A84C', fontFamily: '"Playfair Display", Georgia, serif' }}>좋은피싱</Link>
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const active = link.href !== '/#notices' && link.href !== '/booking/lookup' && pathname.startsWith(link.href)
            return <Link key={link.href} href={link.href} className="text-sm font-medium transition-colors" style={{ color: active ? '#C9A84C' : '#8A9BB0' }}>{link.label}</Link>
          })}
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium transition-colors" style={{ color: pathname.startsWith('/admin') ? '#C9A84C' : '#8A9BB0' }}>관리자</Link>
          )}
        </nav>
        <div className="flex items-center gap-3 justify-self-end">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs" style={{ color: '#C9A84C' }}>{displayName} 님</span>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}>로그아웃</button>
            </div>
          ) : (
            <button onClick={() => router.push('/login')} className="hidden sm:block px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>로그인</button>
          )}
          <button onClick={() => router.push('/#booking')} className="hidden sm:block px-5 py-2 rounded-lg text-sm font-bold transition-all active:scale-95" style={{ background: '#C9A84C', color: '#0D1F35' }}>예약하기</button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5" aria-label="메뉴">
            <span className="block w-5 h-0.5 rounded" style={{ background: mobileOpen ? '#C9A84C' : '#8A9BB0', transform: mobileOpen ? 'rotate(45deg) translate(3px,3px)' : '' }} />
            <span className="block h-0.5 rounded transition-all" style={{ background: '#8A9BB0', width: mobileOpen ? 0 : 20 }} />
            <span className="block w-5 h-0.5 rounded" style={{ background: mobileOpen ? '#C9A84C' : '#8A9BB0', transform: mobileOpen ? 'rotate(-45deg) translate(3px,-3px)' : '' }} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2" style={{ background: 'rgba(13,31,53,0.97)', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-medium" style={{ color: '#8A9BB0', borderBottom: '1px solid rgba(45,95,153,0.2)' }}>{link.label}</Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-medium" style={{ color: '#C9A84C', borderBottom: '1px solid rgba(45,95,153,0.2)' }}>관리자</Link>
          )}
          <button onClick={() => { setMobileOpen(false); router.push('/#booking') }} className="w-full py-3 rounded-xl text-sm font-bold mt-2" style={{ background: '#C9A84C', color: '#0D1F35' }}>예약하기</button>
          {user ? (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs" style={{ color: '#C9A84C' }}>{displayName} 님</span>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>로그아웃</button>
            </div>
          ) : (
            <button onClick={() => { setMobileOpen(false); router.push('/login') }} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>로그인</button>
          )}
        </div>
      )}
    </header>
  )
}
