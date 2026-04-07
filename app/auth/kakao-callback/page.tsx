'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KakaoCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [])

  return (
    <div style={{ background: '#0D1F35', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}
