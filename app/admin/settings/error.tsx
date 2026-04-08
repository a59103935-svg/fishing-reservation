'use client'

import { useEffect } from 'react'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Settings page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-sm font-semibold" style={{ color: '#F87171' }}>
        설정 페이지 오류: {error.message}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl text-sm font-bold"
        style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
      >
        다시 시도
      </button>
    </div>
  )
}
