'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatPrice } from '@/lib/booking'

type OrderStatus = 'pending' | 'confirmed' | 'cancelled'

interface ShopOrder {
  id: string
  name: string
  phone: string
  product_id: string
  quantity: number
  unit_price: number
  status: OrderStatus
  created_at: string
  product?: {
    id: string
    name: string
    image_url: string | null
    category: string
  }
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   '처리중',
  confirmed: '완료',
  cancelled: '취소됨',
}

const STATUS_COLOR: Record<OrderStatus, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(251,191,36,0.15)',  color: '#FBBF24' },
  confirmed: { bg: 'rgba(74,222,128,0.15)',   color: '#4ADE80' },
  cancelled: { bg: 'rgba(80,80,100,0.3)',     color: '#6B7280' },
}

function OrdersContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [name,    setName]    = useState(searchParams.get('name') ?? '')
  const [phone,   setPhone]   = useState(searchParams.get('phone') ?? '')
  const [orders,  setOrders]  = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error,   setError]   = useState('')

  const [cancelTarget, setCancelTarget] = useState<ShopOrder | null>(null)
  const [cancelling,   setCancelling]   = useState(false)

  // Auto-fetch when redirected from order completion
  useEffect(() => {
    if (searchParams.get('complete') === '1' && name && phone) {
      fetchOrders(name, phone)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchOrders(n = name, p = phone) {
    if (!n.trim() || !p.trim()) { setError('이름과 연락처를 입력해 주세요'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/shop/orders?name=${encodeURIComponent(n.trim())}&phone=${encodeURIComponent(p.trim())}`
      )
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '조회 실패'); return }
      setOrders(data)
      setSearched(true)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function cancelOrder() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cancelTarget.id, name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? '취소 실패'); return }
      setOrders((prev) =>
        prev.map((o) => o.id === cancelTarget.id ? { ...o, status: 'cancelled' } : o)
      )
      setCancelTarget(null)
    } catch {
      alert('네트워크 오류가 발생했습니다')
    } finally {
      setCancelling(false)
    }
  }

  const inputStyle = {
    background: 'rgba(13,31,53,0.8)',
    border: '1px solid rgba(45,95,153,0.5)',
    color: '#F8F9FA',
    borderRadius: '12px',
    padding: '12px 14px',
    width: '100%',
    fontSize: '15px',
    outline: 'none',
  }

  const labelStyle = {
    color: '#C9A84C',
    fontSize: '12px',
    fontWeight: 600,
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-16" style={{ background: '#0D1F35' }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 z-30 px-4 h-14 flex items-center gap-3"
        style={{ background: '#0D1F35', borderBottom: '1px solid rgba(45,95,153,0.3)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90"
          style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}
        >
          ←
        </button>
        <p className="text-base font-bold" style={{ color: '#F8F9FA' }}>주문내역</p>
      </header>

      <div className="px-4 py-5 space-y-4">
        {/* 주문 완료 배너 */}
        {searchParams.get('complete') === '1' && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-2"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}
          >
            <span style={{ color: '#4ADE80' }}>✓</span>
            <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>
              주문이 완료됐습니다! 출조 시 현장에서 수령하세요.
            </p>
          </div>
        )}

        {/* 조회 폼 */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <p className="text-sm font-bold" style={{ color: '#F8F9FA' }}>주문자 정보로 조회</p>
          <div>
            <label style={labelStyle}>이름</label>
            <input
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>연락처</label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              style={inputStyle}
            />
          </div>
          {error && <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>}
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#C9A84C', color: '#0D1F35' }}
          >
            {loading ? '조회 중...' : '주문내역 조회'}
          </button>
        </div>

        {/* 주문 목록 */}
        {searched && (
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: '#4A6888' }}>
              총 {orders.length}건
            </p>

            {orders.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}
              >
                <p className="text-sm" style={{ color: '#4A6888' }}>주문내역이 없습니다</p>
              </div>
            ) : (
              orders.map((order) => {
                const isCancelled = order.status === 'cancelled'
                const statusStyle = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending
                const productName = order.product?.name ?? '상품 정보 없음'
                const total = order.unit_price * order.quantity

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl p-4"
                    style={{
                      background: isCancelled ? 'rgba(20,20,30,0.5)' : '#1A3355',
                      border: `1px solid ${isCancelled ? 'rgba(80,80,100,0.3)' : 'rgba(45,95,153,0.35)'}`,
                      opacity: isCancelled ? 0.65 : 1,
                    }}
                  >
                    <div className="flex gap-3">
                      {/* 이미지 */}
                      <div
                        className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden"
                        style={{ background: '#0F1E30' }}
                      >
                        {order.product?.image_url ? (
                          <img src={order.product.image_url} alt={productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(45,95,153,0.4)" strokeWidth="1.5" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold leading-snug line-clamp-2 flex-1" style={{ color: '#F8F9FA' }}>
                            {productName}
                          </p>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                          >
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="text-xs" style={{ color: '#4A6888' }}>
                            {order.quantity}개 × {formatPrice(order.unit_price)}
                          </span>
                          <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>
                            = {formatPrice(total)}
                          </span>
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: '#3A5A7A' }}>
                          {format(new Date(order.created_at), 'M월 d일 (E) HH:mm', { locale: ko })}
                        </p>
                      </div>
                    </div>

                    {!isCancelled && (
                      <button
                        onClick={() => setCancelTarget(order)}
                        className="mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        style={{
                          background: 'rgba(248,113,113,0.1)',
                          color: '#F87171',
                          border: '1px solid rgba(248,113,113,0.3)',
                        }}
                      >
                        취소 신청
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* 취소 확인 모달 */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(8,22,40,0.85)' }}
            onClick={() => !cancelling && setCancelTarget(null)}
          />
          <div
            className="relative w-full max-w-xs rounded-2xl p-6"
            style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.5)' }}
          >
            <h3 className="font-bold text-base mb-2" style={{ color: '#F8F9FA' }}>주문 취소</h3>
            <p className="text-sm mb-1 line-clamp-2" style={{ color: '#93B5D4' }}>
              {cancelTarget.product?.name ?? '해당 상품'}
            </p>
            <p className="text-xs mb-5" style={{ color: '#4A6888' }}>
              수량 {cancelTarget.quantity}개 · {formatPrice(cancelTarget.unit_price * cancelTarget.quantity)}
            </p>
            <p className="text-sm mb-5" style={{ color: '#F8F9FA' }}>정말 취소하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(45,95,153,0.3)', color: '#93B5D4' }}
              >
                닫기
              </button>
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }}
              >
                {cancelling ? '처리 중...' : '취소 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ShopOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
