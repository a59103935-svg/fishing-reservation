'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useBookingStore } from '@/lib/store'
import { PENDING_KEY } from '@/app/checkout/page'

interface PendingData {
  date: string
  busSeats: number[]
  boatSpots: string[]
  paymentMethod: string
}

export default function ResumeReservationModal() {
  const router = useRouter()
  const pathname = usePathname()
  const clearAll = useBookingStore(s => s.clearAll)
  const [pending, setPending] = useState<PendingData | null>(null)

  useEffect(() => {
    // checkout 페이지 자체에서는 표시 안 함
    if (pathname === '/checkout') return
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      if (!raw) return
      const data: PendingData = JSON.parse(raw)
      if (data?.date && data?.busSeats?.length > 0) {
        setPending(data)
      }
    } catch {}
  }, [pathname])

  if (!pending) return null

  function handleResume() {
    setPending(null)
    router.push('/checkout')
  }

  function handleRestart() {
    localStorage.removeItem(PENDING_KEY)
    clearAll()
    setPending(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
        <div className="text-center">
          <div className="text-3xl mb-2">🎣</div>
          <h2 className="text-lg font-bold text-gray-900">진행 중인 예약이 있습니다</h2>
          <p className="text-sm text-gray-500 mt-1">{pending.date} 예약이 완료되지 않았습니다</p>
        </div>
        <div className="space-y-2 pt-1">
          <button
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl active:scale-95 transition-all"
            onClick={handleResume}
          >
            이어서 진행
          </button>
          <button
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95 transition-all"
            onClick={handleRestart}
          >
            처음부터
          </button>
        </div>
      </div>
    </div>
  )
}
