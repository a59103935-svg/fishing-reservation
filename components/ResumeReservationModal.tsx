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

  useEffect(() => {
    if (pathname === '/checkout') { setPending(null); return }
    const data = getPending()
    console.log('[ResumeModal] pathname:', pathname, 'pending:', data)
    if (data) setPending(data)
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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '320px', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎣</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: 0 }}>진행 중인 예약이 있습니다</h2>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '6px' }}>{pending.date} 예약이 완료되지 않았습니다</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', fontWeight: 600, border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' }}
            onClick={handleResume}
          >이어서 진행</button>
          <button
            style={{ width: '100%', padding: '12px', background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' }}
            onClick={handleRestart}
          >처음부터</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
