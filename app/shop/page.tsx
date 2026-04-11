'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/booking'
import { useShopStore } from '@/lib/shopStore'
import type { Product } from '@/types'

const CATEGORIES = [
  { id: 'all',    label: '전체' },
  { id: '채비류', label: '채비류' },
  { id: '미끼류', label: '미끼류' },
  { id: '장비류', label: '장비류' },
  { id: '의류잡화', label: '의류잡화' },
  { id: '기타',   label: '기타' },
] as const
type CategoryId = typeof CATEGORIES[number]['id']

const DELIVERY_FEE = 3000

declare global {
  interface Window {
    daum: {
      Postcode: new (config: { oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void }) => { open: () => void }
    }
  }
}

export default function ShopPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { items, setQty, removeItem, clear } = useShopStore()

  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<CategoryId>('all')
  const [loading,  setLoading]  = useState(true)
  const [ordering, setOrdering] = useState(false)

  const [showForm,      setShowForm]      = useState(false)
  const [guestName,     setGuestName]     = useState('')
  const [guestPhone,    setGuestPhone]    = useState('')
  const [deliveryType,  setDeliveryType]  = useState<'pickup' | 'delivery'>('pickup')
  const [address,       setAddress]       = useState('')
  const [addressDetail, setAddressDetail] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (data) setProducts(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Daum 우편번호 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  function openAddressSearch() {
    new window.daum.Postcode({
      oncomplete: (data) => {
        const road = data.roadAddress || data.jibunAddress
        setAddress(`(${data.zonecode}) ${road}`)
        setAddressDetail('')
      },
    }).open()
  }

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const fee       = deliveryType === 'delivery' ? DELIVERY_FEE : 0
  const orderTotal = cartTotal + fee

  const filtered = category === 'all'
    ? products
    : products.filter((p) => p.category === category)

  function openForm() {
    if (items.length === 0) return
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
  }

  async function submitOrder() {
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('이름과 연락처를 입력해 주세요.')
      return
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('배송지 주소를 입력해 주세요.')
      return
    }
    if (items.length === 0 || ordering) return
    setOrdering(true)
    try {
      const fullAddress = deliveryType === 'delivery'
        ? `${address} ${addressDetail}`.trim()
        : null
      const rows = items.map((i) => ({
        name:          guestName.trim(),
        phone:         guestPhone.trim(),
        product_id:    i.product.id,
        quantity:      i.quantity,
        unit_price:    i.product.price,
        status:        'pending',
        delivery_type: deliveryType,
        address:       fullAddress,
        delivery_fee:  fee,
      }))
      const { error } = await supabase.from('shop_orders').insert(rows)
      if (error) { alert(error.message); return }
      const savedName  = guestName.trim()
      const savedPhone = guestPhone.trim()
      clear()
      setShowForm(false)
      setGuestName('')
      setGuestPhone('')
      setDeliveryType('pickup')
      setAddress('')
      setAddressDetail('')
      router.push(
        `/shop/orders?name=${encodeURIComponent(savedName)}&phone=${encodeURIComponent(savedPhone)}&complete=1&delivery=${deliveryType}`
      )
    } catch {
      alert('주문 처리 중 오류가 발생했습니다.')
    } finally {
      setOrdering(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-36" style={{ background: '#0D1F35' }}>
      {/* 헤더 */}
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest mb-0.5" style={{ color: '#C9A84C' }}>GOOD FISHING</p>
          <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>낚시용품</h1>
          <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>출조 시 수령 또는 택배 배송</p>
          <Link
            href="/shop/orders"
            className="text-[11px] font-semibold mt-1 inline-block"
            style={{ color: '#C9A84C' }}
          >
            주문내역 보기 →
          </Link>
        </div>
        {cartCount > 0 && (
          <button onClick={openForm} className="relative p-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" className="w-7 h-7">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span
              className="absolute -top-0 -right-0 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#C9A84C', color: '#0D1F35' }}
            >
              {cartCount}
            </span>
          </button>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div className="sticky top-0 z-20 px-0 pb-3 pt-1" style={{ background: '#0D1F35' }}>
        <div className="flex overflow-x-auto scrollbar-none px-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: category === cat.id ? '#C9A84C' : 'rgba(30,63,102,0.6)',
                color: category === cat.id ? '#0D1F35' : '#4A6888',
                border: category === cat.id ? 'none' : '1px solid rgba(45,95,153,0.3)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: '#1E3F66' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm" style={{ color: '#4A6888' }}>해당 카테고리 상품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filtered.map((product) => {
              const cartItem = items.find((i) => i.product.id === product.id)
              const qty      = cartItem?.quantity ?? 0
              const soldOut  = product.stock <= 0
              return (
                <button
                  key={product.id}
                  onClick={() => router.push(`/shop/${product.id}`)}
                  className="rounded-2xl overflow-hidden text-left flex flex-col transition-all active:scale-95"
                  style={{ background: '#1E3F66', border: qty > 0 ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(45,95,153,0.4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.border = qty > 0 ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(45,95,153,0.4)')}
                >
                  <div className="relative w-full aspect-square" style={{ background: '#0F1E30' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(45,95,153,0.5)" strokeWidth="1.5" className="w-10 h-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(13,31,53,0.7)' }}>
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(30,63,102,0.8)', color: '#4A6888' }}>품절</span>
                      </div>
                    )}
                    {qty > 0 && (
                      <div
                        className="absolute top-2 right-2 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#C9A84C', color: '#0D1F35' }}
                      >
                        {qty}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: '#F8F9FA' }}>
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black" style={{ color: '#C9A84C' }}>
                        {formatPrice(product.price)}
                      </p>
                      {!soldOut && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
                        >
                          담기
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* 장바구니 인라인 요약 */}
        {items.length > 0 && (
          <div
            className="mt-4 rounded-2xl px-4 py-3"
            style={{ background: '#1E3F66', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: '#C9A84C' }}>장바구니 ({cartCount}개)</p>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2">
                  <span className="flex-1 text-xs truncate" style={{ color: '#93B5D4' }}>{item.product.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setQty(item.product.id, item.quantity - 1) }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
                    >−</button>
                    <span className="text-xs font-bold min-w-[14px] text-center" style={{ color: '#F8F9FA' }}>{item.quantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQty(item.product.id, item.quantity + 1) }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
                    >+</button>
                    <span className="text-xs ml-1" style={{ color: '#C9A84C' }}>{formatPrice(item.product.price * item.quantity)}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(item.product.id) }} style={{ color: '#3A4F66', marginLeft: 2 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div
          className="max-w-sm mx-auto px-4 pt-3 pb-6"
          style={{ background: '#081628', borderTop: '1px solid rgba(45,95,153,0.4)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: '#4A6888' }}>
              총 금액{cartCount > 0 ? ` (${cartCount}개)` : ''}
            </span>
            <span className="text-xl font-black" style={{ color: cartCount > 0 ? '#C9A84C' : '#2D4A66' }}>
              {formatPrice(cartTotal)}
            </span>
          </div>
          <button
            onClick={openForm}
            disabled={items.length === 0}
            className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
            style={{ background: items.length > 0 ? '#C9A84C' : '#1A2A3A', color: items.length > 0 ? '#0D1F35' : '#3A4F66' }}
          >
            {items.length > 0 ? `주문하기 (${formatPrice(cartTotal)})` : '상품을 선택해 주세요'}
          </button>
        </div>
      </div>

      {/* 주문 폼 바텀 시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0" style={{ background: 'rgba(8,22,40,0.85)' }} onClick={closeForm} />
          <div
            className="relative w-full max-w-sm mx-auto rounded-t-3xl overflow-y-auto"
            style={{
              background: '#0F1E30',
              border: '1px solid rgba(45,95,153,0.5)',
              borderBottom: 'none',
              maxHeight: '92dvh',
            }}
          >
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(45,95,153,0.5)' }} />

              {/* ── 수령 방식 ── */}
              <div className="mb-6">
                <p className="text-sm font-bold mb-3" style={{ color: '#F8F9FA' }}>수령 방식</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'pickup',   label: '출조 시 수령', desc: '예약 날짜 현장 수령' },
                    { value: 'delivery', label: '택배 배송',    desc: `배송비 ${formatPrice(DELIVERY_FEE)}` },
                  ] as const).map((opt) => {
                    const active = deliveryType === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDeliveryType(opt.value)}
                        className="rounded-xl p-3 text-left transition-all"
                        style={{
                          background: active ? 'rgba(201,168,76,0.12)' : 'rgba(45,95,153,0.12)',
                          border: `1.5px solid ${active ? '#C9A84C' : 'rgba(45,95,153,0.3)'}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ border: `2px solid ${active ? '#C9A84C' : 'rgba(74,104,136,0.8)'}` }}
                          >
                            {active && <div className="w-2 h-2 rounded-full" style={{ background: '#C9A84C' }} />}
                          </div>
                          <span className="text-xs font-bold" style={{ color: active ? '#C9A84C' : '#93B5D4' }}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-[10px] pl-6" style={{ color: '#4A6888' }}>{opt.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── 주문자 정보 ── */}
              <div className="mb-6">
                <p className="text-sm font-bold mb-3" style={{ color: '#F8F9FA' }}>주문자 정보</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#4A6888' }}>
                      이름 <span style={{ color: '#F87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="홍길동"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#4A6888' }}>
                      연락처 <span style={{ color: '#F87171' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* ── 배송지 (택배 선택 시) ── */}
              {deliveryType === 'delivery' && (
                <div className="mb-6">
                  <p className="text-sm font-bold mb-3" style={{ color: '#F8F9FA' }}>배송지 주소</p>
                  <div className="space-y-2">
                    <button
                      onClick={openAddressSearch}
                      className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-between px-4 transition-all active:scale-95"
                      style={{
                        background: address ? 'rgba(45,95,153,0.2)' : 'rgba(201,168,76,0.08)',
                        border: `1.5px solid ${address ? 'rgba(45,95,153,0.5)' : '#C9A84C'}`,
                        color: address ? '#93B5D4' : '#C9A84C',
                      }}
                    >
                      <span className="truncate text-left text-xs">
                        {address || '우편번호 검색'}
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 ml-2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                    </button>
                    {address && (
                      <input
                        type="text"
                        placeholder="상세주소 (동/호수 등)"
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        className="form-input"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ── 주문 요약 ── */}
              <div
                className="rounded-xl px-4 py-3 mb-5 space-y-1.5"
                style={{ background: 'rgba(30,63,102,0.5)', border: '1px solid rgba(45,95,153,0.25)' }}
              >
                <p className="text-xs font-bold mb-2" style={{ color: '#4A6888' }}>주문 내역</p>
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs">
                    <span className="truncate flex-1 mr-2" style={{ color: '#93B5D4' }}>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span style={{ color: '#C9A84C' }}>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#93B5D4' }}>배송비</span>
                    <span style={{ color: '#C9A84C' }}>{formatPrice(DELIVERY_FEE)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-bold pt-2 mt-1"
                  style={{ borderTop: '1px solid rgba(45,95,153,0.4)' }}
                >
                  <span className="text-sm" style={{ color: '#F8F9FA' }}>합계</span>
                  <span className="text-base" style={{ color: '#C9A84C' }}>{formatPrice(orderTotal)}</span>
                </div>
              </div>

              <button
                onClick={submitOrder}
                disabled={ordering}
                className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50"
                style={{ background: '#C9A84C', color: '#0D1F35' }}
              >
                {ordering ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(13,31,53,0.3)', borderTopColor: '#0D1F35' }} />
                    처리 중...
                  </span>
                ) : `주문 확정 · ${formatPrice(orderTotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
