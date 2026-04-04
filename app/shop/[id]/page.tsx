'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/booking'
import { useShopStore } from '@/lib/shopStore'
import type { Product } from '@/types'

export default function ProductDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()
  const { items, addItem, setQty } = useShopStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty,     setLocalQty] = useState(1)

  const productId = params.id as string

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('products').select('*').eq('id', productId).single()
      if (data) setProduct(data)
      setLoading(false)
    }
    load()
  }, [productId, supabase])

  const cartItem = items.find((i) => i.product.id === productId)
  const inCart   = !!cartItem
  const soldOut  = product ? product.stock <= 0 : false

  function handleAdd() {
    if (!product || soldOut) return
    if (inCart) {
      setQty(productId, (cartItem?.quantity ?? 0) + qty)
    } else {
      addItem(product, qty)
    }
    router.back()
  }

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0D1F35' }}>
        <p style={{ color: '#4A6888' }}>상품을 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#C9A84C' }}>← 돌아가기</button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-36" style={{ background: '#0D1F35' }}>
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
        <p className="text-sm font-bold truncate flex-1" style={{ color: '#F8F9FA' }}>{product.name}</p>
      </header>

      {/* 상품 이미지 */}
      <div className="w-full aspect-square" style={{ background: '#0F1E30' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(45,95,153,0.4)" strokeWidth="1" className="w-20 h-20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs" style={{ color: '#3A5A7A' }}>이미지 없음</p>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="px-5 pt-5 space-y-4">
        {/* 카테고리 + 이름 */}
        <div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
          >
            {product.category}
          </span>
          <h1 className="text-xl font-black mt-2 leading-snug" style={{ color: '#F8F9FA' }}>{product.name}</h1>
        </div>

        {/* 가격 */}
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black" style={{ color: '#C9A84C' }}>{formatPrice(product.price)}</span>
          <span className="text-sm mb-0.5" style={{ color: '#4A6888' }}>/ 개</span>
        </div>

        {/* 재고 */}
        {soldOut ? (
          <div
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-center"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            품절
          </div>
        ) : (
          <div
            className="rounded-xl px-4 py-2 flex items-center justify-between"
            style={{ background: 'rgba(45,95,153,0.15)', border: '1px solid rgba(45,95,153,0.25)' }}
          >
            <span className="text-xs" style={{ color: '#4A6888' }}>재고</span>
            <span className="text-sm font-semibold" style={{ color: '#93C5FD' }}>{product.stock}개 남음</span>
          </div>
        )}

        {/* 설명 */}
        {product.description && (
          <div
            className="rounded-2xl px-4 py-4"
            style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: '#4A6888' }}>상품 설명</p>
            <p className="text-sm leading-relaxed" style={{ color: '#93B5D4' }}>{product.description}</p>
          </div>
        )}

        {/* 수량 선택 */}
        {!soldOut && (
          <div
            className="rounded-2xl px-4 py-4"
            style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#4A6888' }}>수량 선택</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocalQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90"
                style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
              >
                −
              </button>
              <span className="flex-1 text-center text-2xl font-black" style={{ color: '#F8F9FA' }}>{qty}</span>
              <button
                onClick={() => setLocalQty(Math.min(product.stock, qty + 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90"
                style={{ background: 'rgba(45,95,153,0.4)', color: '#93C5FD' }}
              >
                +
              </button>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm" style={{ color: '#4A6888' }}>합계</span>
              <span className="text-lg font-black" style={{ color: '#C9A84C' }}>{formatPrice(product.price * qty)}</span>
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
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
            style={{ background: soldOut ? '#1A2A3A' : '#C9A84C', color: soldOut ? '#3A4F66' : '#0D1F35' }}
          >
            {soldOut
              ? '품절'
              : inCart
              ? `장바구니에 추가 (총 ${(cartItem?.quantity ?? 0) + qty}개)`
              : `장바구니 담기 (${formatPrice(product.price * qty)})`}
          </button>
        </div>
      </div>
    </div>
  )
}
