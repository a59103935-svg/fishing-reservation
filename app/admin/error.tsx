'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: '#0D1F35' }}>
      <p className="text-sm" style={{ color: '#F87171' }}>오류가 발생했습니다: {error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl text-sm font-bold"
        style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}
      >
        다시 시도
      </button>
    </div>
  )
}
