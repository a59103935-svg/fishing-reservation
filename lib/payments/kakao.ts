import axios from 'axios'
import type { KakaoReadyResponse, KakaoApproveResponse } from '@/types'

const KAKAO_API_BASE = 'https://open-api.kakaopay.com/online/v1/payment'

interface KakaoReadyParams {
  orderId: string       // booking_number
  userId: string        // customer_phone
  itemName: string
  quantity: number
  totalAmount: number
  taxFreeAmount?: number
}

interface KakaoApproveParams {
  tid: string
  orderId: string
  userId: string
  pgToken: string
}

function getKakaoHeaders() {
  return {
    Authorization: `SECRET_KEY ${process.env.KAKAOPAY_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * 카카오페이 결제 준비
 */
export async function readyPayment(
  params: KakaoReadyParams
): Promise<KakaoReadyResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const body = {
    cid: process.env.KAKAOPAY_CID ?? 'TC0ONETIME',
    partner_order_id: params.orderId,
    partner_user_id: params.userId,
    item_name: params.itemName,
    quantity: params.quantity,
    total_amount: params.totalAmount,
    tax_free_amount: params.taxFreeAmount ?? 0,
    approval_url: `${baseUrl}/api/payments/kakao/callback?order_id=${params.orderId}`,
    cancel_url: `${baseUrl}/checkout?cancelled=true`,
    fail_url: `${baseUrl}/checkout?failed=true`,
  }

  const response = await axios.post<KakaoReadyResponse>(
    `${KAKAO_API_BASE}/ready`,
    body,
    { headers: getKakaoHeaders() }
  )

  return response.data
}

/**
 * 카카오페이 결제 승인
 */
export async function approvePayment(
  params: KakaoApproveParams
): Promise<KakaoApproveResponse> {
  const body = {
    cid: process.env.KAKAOPAY_CID ?? 'TC0ONETIME',
    tid: params.tid,
    partner_order_id: params.orderId,
    partner_user_id: params.userId,
    pg_token: params.pgToken,
  }

  const response = await axios.post<KakaoApproveResponse>(
    `${KAKAO_API_BASE}/approve`,
    body,
    { headers: getKakaoHeaders() }
  )

  return response.data
}

/**
 * 카카오페이 결제 취소
 */
export async function cancelPayment(params: {
  tid: string
  cancelAmount: number
  cancelTaxFreeAmount: number
}): Promise<void> {
  const body = {
    cid: process.env.KAKAOPAY_CID ?? 'TC0ONETIME',
    tid: params.tid,
    cancel_amount: params.cancelAmount,
    cancel_tax_free_amount: params.cancelTaxFreeAmount,
  }

  await axios.post(`${KAKAO_API_BASE}/cancel`, body, {
    headers: getKakaoHeaders(),
  })
}
