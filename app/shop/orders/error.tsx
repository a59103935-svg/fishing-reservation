'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0D1F35' }}>
      <p style={{ color: '#F87171' }}>오류가 발생했습니다</p>
      <button onClick={reset} style={{ color: '#C9A84C' }}>다시 시도</button>
    </div>
  )
}
