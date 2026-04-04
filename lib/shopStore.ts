import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

export interface ShopCartItem { product: Product; quantity: number }

interface ShopCartState {
  items: ShopCartItem[]
  addItem: (product: Product, quantity: number) => void
  setQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

export const useShopStore = create<ShopCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const existing = get().items.find((i) => i.product.id === product.id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          })
        } else {
          set({ items: [...get().items, { product, quantity }] })
        }
      },
      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) })
        } else {
          set({
            items: get().items.map((i) =>
              i.product.id === productId ? { ...i, quantity: qty } : i
            ),
          })
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'fishing-shop-cart' }
  )
)
