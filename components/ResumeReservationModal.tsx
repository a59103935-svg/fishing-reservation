'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import { useBookingStore } from '@/lib/store'
import { getPending, clearPending, type PendingReservation } from '@/lib/pendingReservation'

export default function ResumeReservationModal() {
  const router = useRouter()
  const pathname = usePathname()
  const clearAll = useBookingStore(s => s.clearAll)
  const [pending, setPending] = useState<PendingReservation | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // pathname이 바뀔 때마다(페이지 이동 시) localStorage 확인
  // checkout 페이지 자체에서는 표시하지 않음
  useEffect(() => {
    if (pathname.startsWith('/checkout')) {
      setPending(null)
      return
    }
    const data = getPending()
    if (data) setPending(data)
    else setPending(null)
  }, [pathname])

  if (!mounted || !pending) return null

  function handleResume() {
    setPending(null)
    router.push('/checkout')
  }

  function handleRestart() {
    clearPending()
    clearAll()
    setPending(null)
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '320px', padding: '28px 24px' }}>
        <p style={{ textAlign: 'center', fontSize: '32px', marginBottom: '12px' }}>🎣</p>
        <h2 style={{ textAlign: 'center', fontSize: '17px', fontWeight: 700, color: '#111', margin: '0 0 6px' }}>진행 중인 예약이 있습니다</h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', margin: '0 0 20px' }}>{pending.date} 예약이 완료되지 않았습니다</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            style={{ padding: '14px', background: '#2563eb', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' }}
            onClick={handleResume}
          >이어서 진행</button>
          <button
            style={{ padding: '14px', background: '#f3f4f6', color: '#374151', fontWeight: 700, border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' }}
            onClick={handleRestart}
          >처음부터</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
