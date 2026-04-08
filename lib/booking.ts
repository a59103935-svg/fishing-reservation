import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { CartItem, SiteSettings } from '@/types'

/**
 * 예약 번호 생성: B + YYYYMMDD + 3자리 순번
 * ex) B202603310001
 */
export async function generateBookingNumber(date: string): Promise<string> {
  const supabase = createClient()
  const dateStr = date.replace(/-/g, '')

  // 해당 날짜의 기존 예약 수 조회
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .like('booking_number', `B${dateStr}%`)

  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `B${dateStr}${seq}`
}

/**
 * 총 결제 금액 계산 (1인당 요금 = bus_price + boat_price)
 */
export function calculateTotal(
  busSeatsCount: number,
  _hasBoatSpot: boolean,
  cartItems: CartItem[],
  settings: Pick<SiteSettings, 'bus_price' | 'boat_price'>
): number {
  const pricePerPerson = settings.bus_price + settings.boat_price
  let total = busSeatsCount * pricePerPerson
  total += cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  return total
}

/**
 * 날짜별 예약된 좌석 목록 조회
 */
export async function getReservedSeats(
  date: string,
  type: 'bus' | 'boat'
): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(type === 'bus' ? 'bus_seat_number' : 'boat_spot_id')
    .eq('date', date)
    .neq('payment_status', 'cancelled')

  if (error || !data) return []

  if (type === 'bus') {
    return (data as { bus_seat_number: number | null }[])
      .filter((b) => b.bus_seat_number != null)
      .map((b) => String(b.bus_seat_number))
  } else {
    return (data as { boat_spot_id: string | null }[])
      .filter((b) => b.boat_spot_id != null)
      .map((b) => String(b.boat_spot_id))
  }
}

/**
 * 날짜별 차단된 좌석 목록 조회
 */
export async function getBlockedSeats(
  date: string,
  type: 'bus' | 'boat'
): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('seat_blocks')
    .select('seat_id')
    .eq('date', date)
    .eq('seat_type', type)

  if (error || !data) return []
  return data.map((b) => b.seat_id)
}

/**
 * 전화번호 포매팅 (01012345678 → 010-1234-5678)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * 금액 포매팅 (50000 → 50,000원)
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

/**
 * 결제 수단 한글 변환
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    kakao: '카카오페이',
    naver: '네이버페이',
    bank: '무통장입금',
    onsite: '현장결제',
  }
  return labels[method] ?? method
}

/**
 * 결제 상태 한글 변환
 */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:       '입금대기',
    visit_pending: '방문예정',
    confirmed:     '예약확정',
    cancelled:     '취소',
  }
  return labels[status] ?? status
}

/**
 * 날짜 포매팅 (2026-03-31 → 2026년 3월 31일 (화))
 */
export function formatDateKorean(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dow = days[d.getDay()]
  return `${year}년 ${month}월 ${day}일 (${dow})`
}

/**
 * 시간 포매팅 (05:00:00 → 오전 5:00)
 */
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${hour}:${m.toString().padStart(2, '0')}`
}
