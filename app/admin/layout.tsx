import AdminNav from './AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ background: '#0D1F35' }}>
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow overflow-y-auto" style={{ background: '#070f1a', borderRight: '1px solid rgba(201,168,76,0.15)' }}>
          <div className="flex items-center flex-shrink-0 px-5 py-5" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
            <div>
              <p className="font-bold text-xl" style={{ color: '#C9A84C', fontFamily: '"Playfair Display", Georgia, serif' }}>좋은피싱</p>
              <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>관리자 패널</p>
            </div>
          </div>
          <nav className="mt-4 flex-1 px-3 space-y-1">
            <a href="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium" style={{ color: '#8A9BB0' }}><span style={{ color: '#C9A84C' }}>◈</span><span>대시보드</span></a>
            <a href="/admin/reservations" className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium" style={{ color: '#8A9BB0' }}><span style={{ color: '#C9A84C' }}>▣</span><span>예약 관리</span></a>
            <a href="/admin/products" className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium" style={{ color: '#8A9BB0' }}><span style={{ color: '#C9A84C' }}></span><span>낚시용품 관리</span></a>
            <a href="/admin/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium" style={{ color: '#8A9BB0' }}><span style={{ color: '#C9A84C' }}>◉</span><span>출조 설정</span></a>
          </nav>
        </div>
      </div>
      <div className="lg:pl-64">
        <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
          {children}
        </div>
      </div>
      <AdminNav />
    </div>
  )
}
