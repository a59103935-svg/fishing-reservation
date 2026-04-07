'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPending, clearPending } from '@/lib/pendingReservation'
import { useBookingStore } from '@/lib/store'

export default function PendingReservationBanner() {
  const router = useRouter()
  const clearAll = useBookingStore(s => s.clearAll)
  const [pendingDate, setPendingDate] = useState<string | null>(null)

  useEffect(() => {
    const data = getPending()
    if (data?.date) setPendingDate(data.date)
  }, [])

  if (!pendingDate) return null

  return (
    <div style={{
      background: '#1e3a5f',
      borderBottom: '1px solid rgba(201,168,76,0.3)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#e2c97e', fontSize: '14px', fontWeight: 600 }}>
        🎣 {pendingDate} 예약이 완료되지 않았습니다
      </span>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => { setPendingDate(null); router.push('/checkout') }}
          style={{ padding: '6px 14px', background: '#C9A84C', color: '#0D1F35', fontWeight: 700, border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >이어서 예약하기</button>
        <button
          onClick={() => { clearPending(); clearAll(); setPendingDate(null) }}
          style={{ padding: '6px 12px', background: 'transparent', color: '#8A9BB0', fontWeight: 600, border: '1px solid rgba(138,155,176,0.4)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >취소</button>
      </div>
    </div>
  )
}
