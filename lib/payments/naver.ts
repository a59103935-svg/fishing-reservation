import axios from 'axios'
import type { NaverPayFormData } from '@/types'

const NAVER_PAY_API_BASE = 'https://dev.pay.naver.com/v1'

interface NaverPayParams {
  merchantPayKey: string
  productName: string
  totalPayAmount: number
  returnUrl: string
}

/**
 * 네이버페이 결제 폼 데이터 생성
 * 클라이언트에서 네이버페이 JS SDK에 전달할 파라미터를 반환
 */
export function createNaverPayForm(params: NaverPayParams): NaverPayFormData {
  return {
    merchantPayKey: params.merchantPayKey,
    productName: params.productName,
    totalPayAmount: params.totalPayAmount,
    taxScopeAmount: params.totalPayAmount,
    taxExScopeAmount: 0,
    returnUrl: params.returnUrl,
  }
}

interface NaverVerifyParams {
  paymentId: string
  merchantPayKey: string
}

/**
 * 네이버페이 결제 검증
 */
export async function verifyPayment(params: NaverVerifyParams): Promise<boolean> {
  try {
    const response = await axios.get(
      `${NAVER_PAY_API_BASE}/payments/${params.paymentId}`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVERPAY_CLIENT_ID ?? '',
          'X-Naver-Client-Secret': process.env.NAVERPAY_CLIENT_SECRET ?? '',
        },
      }
    )

    const data = response.data
    return (
      data?.code === 'Success' &&
      data?.body?.paymentId === params.paymentId &&
      data?.body?.merchantPayKey === params.merchantPayKey
    )
  } catch (err) {
    console.error('네이버페이 검증 오류:', err)
    return false
  }
}

/**
 * 네이버페이 결제 취소
 */
export async function cancelNaverPayment(params: {
  paymentId: string
  cancelAmount: number
  cancelReason: string
}): Promise<boolean> {
  try {
    const response = await axios.post(
      `${NAVER_PAY_API_BASE}/payments/${params.paymentId}/cancel`,
      {
        cancelAmount: params.cancelAmount,
        cancelReason: params.cancelReason,
        cancelRequester: '2',
      },
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVERPAY_CLIENT_ID ?? '',
          'X-Naver-Client-Secret': process.env.NAVERPAY_CLIENT_SECRET ?? '',
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data?.code === 'Success'
  } catch (err) {
    console.error('네이버페이 취소 오류:', err)
    return false
  }
}
