'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:      { label: '입금대기',  color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  confirmed:    { label: '예약확정',  color: '#4ADE80', bg: 'rgba(74,222,128,0.15)' },
  visit_pending:{ label: '방문예정',  color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  cancelled:    { label: '취소',      color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
}

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  reservation_date: string | null
  boat_type: string | null
  seats: number | null
  total_amount: number | null
  payment_status: string | null
  created_at: string
}

export default function BookingLookupPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [results, setResults] = useState<Booking[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!name.trim() || !phone.trim()) return
    setLoading(true)
    setSearched(false)

    const { data } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_phone, reservation_date, boat_type, seats, total_amount, payment_status, created_at')
      .eq('customer_name', name.trim())
      .eq('customer_phone', phone.trim())
      .order('created_at', { ascending: false })

    setResults(data ?? [])
    setSearched(true)
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen px-4 pb-16" style={{ background: '#0D1F35', paddingTop: '88px' }}>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>BOOKING LOOKUP</p>
          <h1 className="text-2xl font-black" style={{ color: '#F8F9FA' }}>예약 조회</h1>
          <p className="text-sm mt-1" style={{ color: '#4A6888' }}>예약 시 입력한 이름과 전화번호로 조회하세요</p>
        </div>

        <div className="rounded-2xl p-5 space-y-4 mb-6" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>예약자 이름</label>
            <input
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#93B5D4' }}>전화번호</label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(13,31,53,0.8)', border: '1px solid rgba(45,95,153,0.5)', color: '#F8F9FA' }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !name.trim() || !phone.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#C9A84C', color: '#0D1F35' }}
          >
            {loading ? '조회 중...' : '예약 조회'}
          </button>
        </div>

        {searched && (
          results && results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: '#4A6888' }}>총 {results.length}건의 예약이 있습니다</p>
              {results.map(b => {
                const status = STATUS_LABEL[b.payment_status ?? ''] ?? { label: b.payment_status ?? '-', color: '#8A9BB0', bg: 'rgba(138,155,176,0.15)' }
                return (
                  <div key={b.id} className="rounded-2xl p-5 space-y-3" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: '#F8F9FA' }}>
                        {b.reservation_date ?? '날짜 미정'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: status.color, background: status.bg }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-xs" style={{ color: '#8A9BB0' }}>
                      <div>
                        <span style={{ color: '#4A6888' }}>출조유형</span>
                        <p className="mt-0.5 font-medium" style={{ color: '#93B5D4' }}>
                          {b.boat_type === 'boat' ? '보트' : b.boat_type === 'bus' ? '버스' : b.boat_type ?? '-'}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: '#4A6888' }}>인원</span>
                        <p className="mt-0.5 font-medium" style={{ color: '#93B5D4' }}>{b.seats ? `${b.seats}명` : '-'}</p>
                      </div>
                      <div>
                        <span style={{ color: '#4A6888' }}>결제금액</span>
                        <p className="mt-0.5 font-medium" style={{ color: '#C9A84C' }}>
                          {b.total_amount ? `${b.total_amount.toLocaleString()}원` : '-'}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: '#4A6888' }}>예약일시</span>
                        <p className="mt-0.5 font-medium" style={{ color: '#93B5D4' }}>
                          {new Date(b.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.4)' }}>
              <p className="text-sm" style={{ color: '#4A6888' }}>예약 내역이 없습니다</p>
              <p className="text-xs mt-1" style={{ color: '#2D5F99' }}>이름과 전화번호를 다시 확인해주세요</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
