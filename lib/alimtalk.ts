import axios from 'axios'
import CryptoJS from 'crypto-js'
import type { Booking } from '@/types'
import { formatDateKorean, formatPrice, getPaymentMethodLabel, formatTime } from './booking'

const COOLSMS_API_BASE = 'https://api.coolsms.co.kr'

/**
 * HMAC-SHA256 인증 헤더 생성
 */
function getAuthHeader(): string {
  const apiKey = process.env.COOLSMS_API_KEY ?? ''
  const apiSecret = process.env.COOLSMS_API_SECRET ?? ''
  const date = new Date().toISOString()
  const salt = Math.random().toString(36).substring(2, 15)
  const data = `${date}${salt}`
  const signature = CryptoJS.HmacSHA256(data, apiSecret).toString(CryptoJS.enc.Hex)
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

interface AlimtalkMessage {
  to: string
  from: string
  type: 'ATA'
  kakaoOptions: {
    pfId: string
    templateId: string
    variables: Record<string, string>
  }
}

async function sendAlimtalk(to: string, templateId: string, variables: Record<string, string>): Promise<void> {
  const message: AlimtalkMessage = {
    to: to.replace(/-/g, ''),
    from: process.env.FROM_PHONE ?? '',
    type: 'ATA',
    kakaoOptions: {
      pfId: process.env.COOLSMS_SENDER_KEY ?? '',
      templateId,
      variables,
    },
  }

  try {
    await axios.post(
      `${COOLSMS_API_BASE}/messages/v4/send`,
      { message },
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    console.error('알림톡 발송 실패:', err)
    // 알림톡 실패가 예약을 막으면 안 되므로 에러를 던지지 않음
  }
}

/**
 * 예약 확인 알림톡 발송 (고객)
 */
export async function sendBookingConfirm(booking: Booking): Promise<void> {
  const templateId = process.env.KAKAO_TEMPLATE_BOOKING_CONFIRM ?? ''

  const seatInfo = booking.bus_seat_number
    ? `버스 ${booking.bus_seat_number}번석${booking.boat_spot_id ? ` / 배 ${booking.boat_spot_id}` : ''}`
    : '좌석 미선택'

  await sendAlimtalk(booking.customer_phone, templateId, {
    '#{예약번호}': booking.booking_number,
    '#{고객명}': booking.customer_name,
    '#{출조일}': formatDateKorean(booking.date),
    '#{좌석정보}': seatInfo,
    '#{결제금액}': formatPrice(booking.total_amount),
    '#{결제방법}': getPaymentMethodLabel(booking.payment_method),
  })
}

/**
 * 예약 취소 알림톡 발송 (고객)
 */
export async function sendBookingCancelled(booking: Booking): Promise<void> {
  const templateId = process.env.KAKAO_TEMPLATE_BOOKING_CONFIRM ?? ''

  await sendAlimtalk(booking.customer_phone, templateId, {
    '#{예약번호}': booking.booking_number,
    '#{고객명}': booking.customer_name,
    '#{출조일}': formatDateKorean(booking.date),
    '#{취소사유}': '관리자 처리',
  })
}

/**
 * 신규 예약 알림톡 발송 (관리자)
 */
export async function sendAdminNewBooking(booking: Booking): Promise<void> {
  const adminPhone = process.env.ADMIN_PHONE ?? ''
  if (!adminPhone) return

  const templateId = process.env.KAKAO_TEMPLATE_BOOKING_CONFIRM ?? ''

  const seatInfo = booking.bus_seat_number
    ? `버스 ${booking.bus_seat_number}번석${booking.boat_spot_id ? ` / 배 ${booking.boat_spot_id}` : ''}`
    : '좌석 미선택'

  await sendAlimtalk(adminPhone, templateId, {
    '#{예약번호}': booking.booking_number,
    '#{고객명}': booking.customer_name,
    '#{연락처}': booking.customer_phone,
    '#{출조일}': formatDateKorean(booking.date),
    '#{좌석정보}': seatInfo,
    '#{결제금액}': formatPrice(booking.total_amount),
    '#{결제방법}': getPaymentMethodLabel(booking.payment_method),
  })
}
