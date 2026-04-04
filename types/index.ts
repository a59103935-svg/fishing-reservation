// ============================================
// 낚시 출조 예약 시스템 - 타입 정의
// ============================================

export type PaymentMethod = 'kakao' | 'naver' | 'bank' | 'onsite'
export type PaymentStatus = 'pending' | 'visit_pending' | 'confirmed' | 'cancelled'
export type SeatType = 'bus' | 'boat'

export interface ScheduleSetting {
  id: string
  date: string // YYYY-MM-DD
  is_holiday: boolean
  bus_total_seats: number
  boat_total_spots: number
  bus_price: number
  boat_price: number
  departure_time: string // HH:mm:ss
  return_time: string    // HH:mm:ss
  notes?: string
  created_at: string
  updated_at: string
}

export interface SiteSettings {
  id: string
  site_name: string
  bus_total_seats: number
  boat_total_spots: number
  bus_price: number
  boat_price: number
  departure_time: string
  return_time: string
  bank_name: string
  bank_account: string
  bank_holder: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_number: string
  date: string
  customer_name: string
  customer_phone: string
  bus_seat_number?: number | null
  boat_spot_id?: string | null
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  total_amount: number
  depositor_name?: string | null
  pg_tid?: string | null
  notes?: string | null
  created_at: string
  confirmed_at?: string | null
  cancelled_at?: string | null
  product_orders?: ProductOrderWithProduct[]
}

export interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  stock: number
  image_url?: string | null
  category: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductOrder {
  id: string
  booking_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}

export interface ProductOrderWithProduct extends ProductOrder {
  product?: Product
}

export interface SeatBlock {
  id: string
  date: string
  seat_type: SeatType
  seat_id: string
  reason?: string | null
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface BookingState {
  selectedDate: string | null
  selectedBusSeats: number[]
  selectedBoatSpots: string[]
  cartItems: CartItem[]
  customerName: string
  customerPhone: string
  notes: string
  paymentMethod: PaymentMethod
  depositorName: string
  isCheckoutInProgress: boolean
  // actions
  setDate: (date: string) => void
  toggleBusSeat: (seat: number) => void
  clearBusSeats: () => void
  toggleBoatSpot: (spot: string) => void
  clearBoatSpots: () => void
  setNotes: (notes: string) => void
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setCustomerInfo: (name: string, phone: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setDepositorName: (name: string) => void
  setCheckoutInProgress: (v: boolean) => void
  clearAll: () => void
}

// 카카오페이 응답 타입
export interface KakaoReadyResponse {
  tid: string
  next_redirect_app_url: string
  next_redirect_mobile_url: string
  next_redirect_pc_url: string
  android_app_scheme: string
  ios_app_scheme: string
  created_at: string
}

export interface KakaoApproveResponse {
  aid: string
  tid: string
  cid: string
  partner_order_id: string
  partner_user_id: string
  payment_method_type: string
  amount: {
    total: number
    tax_free: number
    vat: number
    point: number
    discount: number
  }
  item_name: string
  quantity: number
  created_at: string
  approved_at: string
}

// 네이버페이 타입
export interface NaverPayFormData {
  merchantPayKey: string
  productName: string
  totalPayAmount: number
  taxScopeAmount: number
  taxExScopeAmount: number
  returnUrl: string
}

// 달력 날짜 정보
export interface CalendarDay {
  date: string
  status: 'available' | 'almost_full' | 'full' | 'holiday' | 'past'
  reservedCount: number
  totalSeats: number
  isHoliday: boolean
}

// 예약 폼 입력
export interface BookingFormInput {
  date: string
  customerName: string
  customerPhone: string
  busSeatNumber?: number | null
  boatSpotId?: string | null
  paymentMethod: PaymentMethod
  depositorName?: string
  cartItems: CartItem[]
  totalAmount: number
}
