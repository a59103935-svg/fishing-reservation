import type { Metadata, Viewport } from 'next'
import { Playfair_Display } from 'next/font/google'
import './globals.css'
import SetupGate from '@/components/SetupGate'
import TopTabBar from '@/components/TopTabBar'
import Footer from '@/components/Footer'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '좋은피싱 — 경남 최고의 선상낚시 출조 예약',
  description: '좋은피싱 선상낚시 출조 예약. 버스·배 좌석 간편 예약, 낚시용품 주문.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D1F35',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={playfair.variable}>
      <body className="min-h-screen font-sans antialiased" style={{ background: '#0D1F35', color: '#F8F9FA' }}>
        <SetupGate>
          <TopTabBar />
          {children}
          <Footer />
        </SetupGate>
      </body>
    </html>
  )
}
