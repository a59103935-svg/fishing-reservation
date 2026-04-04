import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BookingState, CartItem, Product, PaymentMethod } from '@/types'

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedDate: null,
      selectedBusSeats: [],
      selectedBoatSpots: [],
      cartItems: [],
      customerName: '',
      customerPhone: '',
      notes: '',
      paymentMethod: 'kakao',
      depositorName: '',

      setDate: (date: string) =>
        set({
          selectedDate: date,
          selectedBusSeats: [],
          selectedBoatSpots: [],
        }),

      toggleBusSeat: (seat: number) => {
        const seats = get().selectedBusSeats
        if (seats.includes(seat)) {
          set({ selectedBusSeats: seats.filter((s) => s !== seat) })
        } else {
          set({ selectedBusSeats: [...seats, seat].sort((a, b) => a - b) })
        }
      },

      clearBusSeats: () => set({ selectedBusSeats: [] }),

      toggleBoatSpot: (spot: string) => {
        const spots = get().selectedBoatSpots
        if (spots.includes(spot)) {
          set({ selectedBoatSpots: spots.filter((s) => s !== spot) })
        } else {
          set({ selectedBoatSpots: [...spots, spot].sort((a, b) => Number(a) - Number(b)) })
        }
      },

      clearBoatSpots: () => set({ selectedBoatSpots: [] }),

      addToCart: (product: Product) => {
        const items = get().cartItems
        const existing = items.find((i) => i.product.id === product.id)
        if (existing) {
          set({
            cartItems: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({ cartItems: [...items, { product, quantity: 1 }] })
        }
      },

      removeFromCart: (productId: string) =>
        set({
          cartItems: get().cartItems.filter((i) => i.product.id !== productId),
        }),

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        set({
          cartItems: get().cartItems.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        })
      },

      setCustomerInfo: (name: string, phone: string) =>
        set({ customerName: name, customerPhone: phone }),

      setNotes: (notes: string) => set({ notes }),

      setPaymentMethod: (method: PaymentMethod) =>
        set({ paymentMethod: method }),

      setDepositorName: (name: string) =>
        set({ depositorName: name }),

      clearAll: () =>
        set({
          selectedDate: null,
          selectedBusSeats: [],
          selectedBoatSpots: [],
          cartItems: [],
          customerName: '',
          customerPhone: '',
          notes: '',
          paymentMethod: 'kakao',
          depositorName: '',
        }),
    }),
    {
      name: 'fishing-booking-store',
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        selectedBusSeats: state.selectedBusSeats,
        selectedBoatSpots: state.selectedBoatSpots,
        cartItems: state.cartItems,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        notes: state.notes,
        paymentMethod: state.paymentMethod,
        depositorName: state.depositorName,
      }),
    }
  )
)
