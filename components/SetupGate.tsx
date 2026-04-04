'use client'

export function isConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function SetupGate({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <span className="text-5xl">🎣</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">행복낚시 출조 예약</h1>
            <p className="text-gray-500 text-sm mt-1">초기 설정이 필요합니다</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 font-semibold text-sm">⚙️ Supabase 연결 필요</p>
            <p className="text-amber-700 text-xs mt-1">
              .env.local 파일에 Supabase 키를 입력하면 앱이 시작됩니다.
            </p>
          </div>

          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span><a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a> 에서 프로젝트 생성</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Project Settings → API 에서 URL, anon key 복사</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>.env.local 파일에 붙여넣기 후 서버 재시작</span>
            </li>
          </ol>

          <div className="mt-6 bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-2 font-mono">.env.local</p>
            <pre className="text-green-400 text-xs font-mono leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
