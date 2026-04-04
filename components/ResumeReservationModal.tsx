'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useBookingStore } from '@/lib/store'

export default function ResumeReservationModal() {
  const router = useRouter()
  const pathname = usePathname()
  const { isCheckoutInProgress, selectedDate, clearAll } = useBookingStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isCheckoutInProgress && pathname !== '/checkout') {
      setShow(true)
    }
  }, []) // 앱 진입 시 1회만 체크

  if (!show) return null

  function handleResume() {
    setShow(false)
    router.push('/checkout')
  }

  function handleRestart() {
    clearAll()
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🎣</div>
          <h2 className="text-lg font-bold text-gray-900">진행 중인 예약이 있습니다</h2>
          {selectedDate && (
            <p className="text-sm text-gray-500 mt-1">{selectedDate} 예약이 완료되지 않았습니다</p>
          )}
        </div>
        <div className="space-y-2 pt-1">
          <button
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            onClick={handleResume}
          >
            이어서 진행
          </button>
          <button
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            onClick={handleRestart}
          >
            처음부터
          </button>
        </div>
      </div>
    </div>
  )
}
