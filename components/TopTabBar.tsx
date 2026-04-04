'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const HIDDEN_PREFIXES = ['/booking/', '/admin', '/confirmation', '/checkout']

const NAV_LINKS = [
  { href: '/#booking',  label: '예약' },
  { href: '/shop',      label: '낚시용품' },
  { href: '/#notices',  label: '공지사항' },
  { href: '/info',      label: '문의' },
  { href: '/catch',     label: '조황게시판' },
]

export default function TopTabBar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ background: scrolled ? 'rgba(13,31,53,0.92)' : '#0D1F35', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-wide" style={{ color: '#C9A84C', fontFamily: '"Playfair Display", Georgia, serif' }}>좋은피싱</Link>
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const active = link.href !== '/#booking' && link.href !== '/#notices' && pathname.startsWith(link.href)
            return <Link key={link.href} href={link.href} className="text-sm font-medium transition-colors" style={{ color: active ? '#C9A84C' : '#8A9BB0' }}>{link.label}</Link>
          })}
        </nav>
        <div className="flex items-center gap-3">
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
          <button onClick={() => { setMobileOpen(false); router.push('/#booking') }} className="w-full py-3 rounded-xl text-sm font-bold mt-2" style={{ background: '#C9A84C', color: '#0D1F35' }}>예약하기</button>
        </div>
      )}
    </header>
  )
}
