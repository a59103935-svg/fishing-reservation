'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDDEN_PREFIXES = ['/booking/', '/admin', '/confirmation', '/checkout']

export default function Footer() {
  const pathname = usePathname()
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <footer style={{ background: '#070f1a', borderTop: '1px solid rgba(201,168,76,0.25)' }}>
      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* 상단 */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
          {/* 브랜드 */}
          <div>
            <p
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#C9A84C' }}
            >
              좋은피싱
            </p>
            <p className="text-xs" style={{ color: '#8A9BB0' }}>경남 최고의 선상낚시 출조 서비스</p>
          </div>

          {/* 링크 */}
          <div className="flex gap-12 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-xs tracking-widest mb-3" style={{ color: '#C9A84C' }}>서비스</p>
              {[['/#booking','예약하기'], ['/shop','낚시용품'], ['/info','이용안내']].map(([href, label]) => (
                <Link key={href} href={href} className="block" style={{ color: '#8A9BB0' }}>{label}</Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-xs tracking-widest mb-3" style={{ color: '#C9A84C' }}>문의</p>
              <p style={{ color: '#8A9BB0' }}>카카오채널</p>
              <p style={{ color: '#8A9BB0' }}>전화 문의</p>
            </div>
          </div>
        </div>

        <div className="gold-divider mb-6" />

        {/* 사업자 정보 */}
        <div className="text-xs space-y-1.5" style={{ color: '#4A6888' }}>
          <p>상호: 좋은피싱 &nbsp;|&nbsp; 대표: 강현구 &nbsp;|&nbsp; 사업자번호: 000-00-00000</p>
          <p>주소: 경상남도 &nbsp;|&nbsp; 연락처: 010-0000-0000</p>
          <p className="mt-3" style={{ color: '#2D4060' }}>© 2025 좋은피싱. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
