'use client'

import { useBookingStore } from '@/lib/store'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/booking'

interface ProductListProps {
  products: Product[]
}

export default function ProductList({ products }: ProductListProps) {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useBookingStore()

  function getQuantity(productId: string): number {
    return cartItems.find((i) => i.product.id === productId)?.quantity ?? 0
  }

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  )

  const activeProducts = products.filter((p) => p.is_active)

  if (activeProducts.length === 0) {
    return (
      <p className="text-center text-gray-400 py-6 text-sm">
        등록된 상품이 없습니다
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {activeProducts.map((product) => {
          const qty = getQuantity(product.id)
          const isSoldOut = product.stock <= 0

          return (
            <div
              key={product.id}
              className={`bg-white rounded-xl border p-3 flex flex-col gap-2 ${
                isSoldOut ? 'opacity-60 border-gray-200' : 'border-gray-200'
              }`}
            >
              {/* 상품명 */}
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                  {product.name}
                </p>
                {product.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {product.description}
                  </p>
                )}
              </div>

              {/* 가격 */}
              <p className="text-base font-bold text-blue-600">
                {product.price.toLocaleString()}원
              </p>

              {/* 수량 조절 */}
              {isSoldOut ? (
                <div className="bg-gray-100 rounded-lg py-2 text-center text-xs text-gray-400 font-medium">
                  품절
                </div>
              ) : qty === 0 ? (
                <button
                  className="bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"
                  onClick={() => addToCart(product)}
                >
                  담기
                </button>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 rounded-lg px-2 py-1">
                  <button
                    className="w-8 h-8 flex items-center justify-center text-blue-600 font-bold text-lg hover:bg-blue-100 rounded-lg active:scale-90 transition-all"
                    onClick={() => {
                      if (qty === 1) removeFromCart(product.id)
                      else updateQuantity(product.id, qty - 1)
                    }}
                  >
                    −
                  </button>
                  <span className="font-bold text-blue-700 min-w-[20px] text-center">
                    {qty}
                  </span>
                  <button
                    className="w-8 h-8 flex items-center justify-center text-blue-600 font-bold text-lg hover:bg-blue-100 rounded-lg active:scale-90 transition-all"
                    onClick={() => updateQuantity(product.id, qty + 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 장바구니 합계 */}
      {cartItems.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-800">
              낚시용품 합계 ({cartItems.reduce((s, i) => s + i.quantity, 0)}개)
            </span>
            <span className="text-base font-bold text-blue-700">
              {formatPrice(cartTotal)}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs text-blue-700">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>{(item.product.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
