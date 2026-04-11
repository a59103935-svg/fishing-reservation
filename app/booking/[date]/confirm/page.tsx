'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useBookingStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { formatDateKorean, formatPrice } from '@/lib/booking'
import type { Booking, PaymentMethod, SiteSettings } from '@/types'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; desc: string; disabled?: boolean }[] = [
  { id: 'kakao',  label: '카카오페이', icon: '', desc: '카카오페이로 간편결제',    disabled: true },
  { id: 'naver',  label: '네이버페이', icon: '', desc: '네이버페이로 간편결제',    disabled: true },
  { id: 'bank',   label: '무통장입금', icon: '▣', desc: '입금 확인 후 예약 확정' },
  { id: 'onsite', label: '방문예정 등록', icon: '◉', desc: '현장결제 — 자리 보장 안 됨, 선착순' },
]

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

const STEPS = ['버스 좌석', '배 자리', '예약 확정']

export default function ConfirmPage() {
  const params       = useParams()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const dateStr      = params.date as string
  const supabase     = createClient()
  const store = useBookingStore()

  const busSeats: number[] = useMemo(() => {
    const urlVal = searchParams.get('busSeats')
    if (urlVal) return urlVal.split(',').map(Number).filter(Boolean)
    return store.selectedBusSeats
  }, [searchParams, store.selectedBusSeats])

  const boatSpots: string[] = useMemo(() => {
    const urlVal = searchParams.get('boatSpots')
    if (urlVal) return urlVal.split(',').filter(Boolean)
    return store.selectedBoatSpots
  }, [searchParams, store.selectedBoatSpots])

  const [name,      setName]      = useState(store.customerName)
  const [phone,     setPhone]     = useState(store.customerPhone)
  const [memo,      setMemo]      = useState(store.notes)
  const [payMethod, setPayMethod] = useState<PaymentMethod>(store.paymentMethod)
  const [nameErr,   setNameErr]   = useState('')
  const [phoneErr,  setPhoneErr]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [settings,  setSettings]  = useState<SiteSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [dupBooking, setDupBooking] = useState<Booking | null>(null)

  useEffect(() => {
    if (busSeats.length === 0) router.replace(`/booking/${dateStr}`)
  }, [busSeats, dateStr, router])

  useEffect(() => {
    supabase.from('site_settings').select('*').single().then(({ data }) => {
      if (data) setSettings(data)
      setSettingsLoading(false)
    })
  }, [supabase])

  const busPrice   = settings?.bus_price  ?? 0
  const boatPrice  = settings?.boat_price ?? 0
  const busTotal   = busSeats.length  * busPrice
  const boatTotal  = boatSpots.length * boatPrice
  const grandTotal = busTotal + boatTotal
  const headcount  = busSeats.length

  function handlePhone(v: string) { setPhone(formatPhone(v)) }

  function validate(): boolean {
    let ok = true
    if (!name.trim()) { setNameErr('이름을 입력해 주세요'); ok = false } else setNameErr('')
    if (phone.replace(/\D/g, '').length < 10) { setPhoneErr('올바른 연락처를 입력해 주세요'); ok = false } else setPhoneErr('')
    return ok
  }

  async function handleSubmit() {
    if (!validate() || loading) return

    // 동일 연락처 active 예약 중복 확인
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, date, bus_seat_number, boat_spot_id, payment_status')
      .eq('customer_phone', phone)
      .in('payment_status', ['pending', 'confirmed', 'visit_pending'])
      .order('date', { ascending: true })
      .limit(1)
      .single()

    if (existing) {
      setDupBooking(existing as Booking)
      return
    }

    await submitBooking()
  }

  async function submitBooking() {
    setDupBooking(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:           dateStr,
          customerName:   name.trim(),
          customerPhone:  phone,
          busSeatNumber:  busSeats[0] ?? null,
          boatSpotId:     boatSpots[0] ?? null,
          paymentMethod:  payMethod,
          totalAmount:    grandTotal,
          cartItems:      [],
          depositorName:  name.trim(),
          notes:          memo || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          alert('선택하신 좌석은 방금 다른 분이 예약했습니다. 좌석 선택 화면으로 돌아가 다시 선택해 주세요.')
          router.replace(`/booking/${dateStr}`)
          return
        }
        alert(json.error ?? '예약 처리 중 오류가 발생했습니다.')
        return
      }

      store.setCustomerInfo(name, phone)
      store.setNotes(memo)
      store.setPaymentMethod(payMethod)

      if (payMethod === 'kakao' || payMethod === 'naver') {
        router.push(`/booking/payment?id=${json.id}`)
      } else {
        router.push(`/booking/complete?id=${json.id}`)
      }
    } catch (e) {
      console.error(e)
      alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (settingsLoading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center" style={{ background: '#0D1F35' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen pb-36" style={{ background: '#0D1F35' }}>
      <header className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3" style={{ background: '#0D1F35', borderBottom: '1px solid rgba(45,95,153,0.3)' }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90" style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}></button>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: '#4A6888' }}>예약 확정</p>
          <p className="text-sm font-bold leading-tight" style={{ color: '#F8F9FA' }}>{formatDateKorean(dateStr)}</p>
        </div>
      </header>

      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => {
            const active = i === 2
            const done   = i < 2
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1" style={{ background: active ? '#C9A84C' : done ? 'rgba(201,168,76,0.3)' : 'rgba(45,95,153,0.25)', color: active ? '#0D1F35' : done ? '#C9A84C' : '#3A5A7A' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: active ? '#C9A84C' : done ? '#8A9BB0' : '#3A5A7A' }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px flex-1 mb-4 mx-1" style={{ background: done ? 'rgba(201,168,76,0.4)' : 'rgba(45,95,153,0.3)' }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
            <span style={{ color: '#C9A84C', fontSize: 14 }}>◈</span>
            <p className="font-bold text-sm" style={{ color: '#C9A84C' }}>예약 요약</p>
          </div>
          <div className="px-4 py-4 space-y-2.5 text-sm">
            <SummaryRow label="출조일" value={formatDateKorean(dateStr)} bold />
            <SummaryRow label="버스 좌석" value={`${busSeats.join(', ')}번`} />
            {boatSpots.length > 0 && <SummaryRow label="배 자리" value={`${boatSpots.join(', ')}번`} />}
            <SummaryRow label="인원" value={`${headcount}명`} />
            <div className="pt-2" style={{ borderTop: '1px solid rgba(45,95,153,0.3)' }}>
              <SummaryRow label="버스 요금" value={formatPrice(busTotal)} />
              {boatTotal > 0 && <SummaryRow label="배 요금" value={formatPrice(boatTotal)} />}
            </div>
          </div>
        </div>

        <div className="rounded-2xl px-4 py-4 space-y-3" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
          <p className="font-bold" style={{ color: '#F8F9FA' }}>예약자 정보</p>
          <DarkField label="이름" required error={nameErr}>
            <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} className="form-input" style={{ borderColor: nameErr ? '#F87171' : undefined }} />
          </DarkField>
          <DarkField label="연락처" required error={phoneErr}>
            <input type="tel" inputMode="numeric" placeholder="010-0000-0000" value={phone} onChange={(e) => handlePhone(e.target.value)} className="form-input" style={{ borderColor: phoneErr ? '#F87171' : undefined }} />
          </DarkField>
          <DarkField label="인원수">
            <div className="w-full px-4 py-3 rounded-xl text-sm flex justify-between" style={{ background: 'rgba(45,95,153,0.2)', border: '1px solid rgba(45,95,153,0.3)', color: '#F8F9FA' }}>
              <span className="font-semibold">{headcount}명</span>
              <span className="text-xs" style={{ color: '#4A6888' }}>버스 좌석 수 자동 적용</span>
            </div>
          </DarkField>
          <DarkField label="메모" optional>
            <textarea placeholder="요청사항이 있으면 입력해 주세요" value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className="form-input resize-none" />
          </DarkField>
        </div>

        <div className="rounded-2xl px-4 py-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
          <p className="font-bold mb-3" style={{ color: '#F8F9FA' }}>결제 방법</p>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <button key={m.id} onClick={() => !m.disabled && setPayMethod(m.id)} disabled={m.disabled} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all" style={{ border: `2px solid ${m.disabled ? 'rgba(45,95,153,0.2)' : payMethod === m.id ? '#C9A84C' : 'rgba(45,95,153,0.3)'}`, background: m.disabled ? 'rgba(45,95,153,0.08)' : payMethod === m.id ? 'rgba(201,168,76,0.08)' : 'rgba(45,95,153,0.12)', opacity: m.disabled ? 0.5 : 1, cursor: m.disabled ? 'not-allowed' : 'pointer' }}>
                <span className="text-lg" style={{ color: m.disabled ? '#3A5A7A' : payMethod === m.id ? '#C9A84C' : '#8A9BB0' }}>{m.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: m.disabled ? '#3A5A7A' : '#F8F9FA' }}>{m.label}</p>
                    {m.disabled && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(45,95,153,0.3)', color: '#4A6888' }}>준비중</span>}
                  </div>
                  <p className="text-xs" style={{ color: '#4A6888' }}>{m.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: !m.disabled && payMethod === m.id ? '#C9A84C' : 'rgba(45,95,153,0.4)' }}>
                  {!m.disabled && payMethod === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#C9A84C' }} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {payMethod === 'onsite' && (
          <div className="rounded-2xl px-4 py-4" style={{ background: 'rgba(248,191,36,0.06)', border: '1px solid rgba(248,191,36,0.2)' }}>
            <p className="font-bold mb-2" style={{ color: '#FBBF24' }}> 현장결제 주의사항</p>
            <div className="text-sm space-y-1" style={{ color: '#A88A30' }}>
              <p>• 출발 30분 전까지 반드시 도착해 주세요</p>
              <p>• 당일 취소 시 환불이 불가합니다</p>
              <p>• 현금 및 카드 결제 모두 가능합니다</p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-sm mx-auto px-4 pt-3 pb-6" style={{ background: '#081628', borderTop: '1px solid rgba(45,95,153,0.4)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: '#4A6888' }}>총 결제금액</span>
            <span className="text-xl font-black" style={{ color: '#C9A84C' }}>{formatPrice(grandTotal)}</span>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50" style={{ background: '#C9A84C', color: '#0D1F35' }}>
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(13,31,53,0.3)', borderTopColor: '#0D1F35' }} />처리 중...</span> : `예약하기 (${formatPrice(grandTotal)})`}
          </button>
        </div>
      </div>

      {/* 중복 예약 확인 모달 */}
      {dupBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setDupBooking(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl p-6 space-y-5"
            style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 제목 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <span className="text-xl">!</span>
              </div>
              <p className="text-base font-black" style={{ color: '#F8F9FA' }}>이미 예약이 있습니다</p>
            </div>

            {/* 기존 예약 정보 */}
            <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: 'rgba(13,31,53,0.6)', border: '1px solid rgba(45,95,153,0.35)' }}>
              <p style={{ color: '#93B5D4' }}>기존 예약</p>
              <p className="font-bold" style={{ color: '#F8F9FA' }}>
                {formatDateKorean(dupBooking.date)}
              </p>
              <p style={{ color: '#C9A84C', fontWeight: 600 }}>
                {[
                  dupBooking.bus_seat_number != null && `버스 ${dupBooking.bus_seat_number}번`,
                  dupBooking.boat_spot_id && `배 ${dupBooking.boat_spot_id}`,
                ].filter(Boolean).join(', ')}
              </p>
            </div>

            <p className="text-sm text-center" style={{ color: '#8A9BB0' }}>
              <span style={{ color: '#F8F9FA', fontWeight: 700 }}>{name.trim()}</span>님은 이미 예약하셨습니다.
              <br />추가로 예약하시겠습니까?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDupBooking(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(45,95,153,0.2)', color: '#8A9BB0', border: '1px solid rgba(45,95,153,0.3)' }}
              >
                취소
              </button>
              <button
                onClick={submitBooking}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: '#C9A84C', color: '#0D1F35' }}
              >
                {loading ? '처리 중...' : '추가 예약하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, sub, bold }: { label: string; value: string; sub?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <span style={{ color: '#4A6888' }}>{label}</span>
      <div className="text-right">
        <span style={{ color: bold ? '#F8F9FA' : '#93B5D4', fontWeight: bold ? 700 : 600 }}>{value}</span>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#4A6888' }}>{sub}</p>}
      </div>
    </div>
  )
}

function BankRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: '#4A6888' }}>{label}</span>
      {copyable ? (
        <button onClick={handleCopy} className="flex items-center gap-1.5 active:scale-95 transition-all">
          <span className="font-semibold" style={{ color: '#C9A84C' }}>{value}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: copied ? '#22c55e' : 'rgba(201,168,76,0.2)', color: copied ? 'white' : '#C9A84C' }}>{copied ? '복사됨!' : '복사'}</span>
        </button>
      ) : (
        <span className="font-semibold" style={{ color: '#C9A84C' }}>{value}</span>
      )}
    </div>
  )
}

function DarkField({ label, required, optional, error, children }: { label: string; required?: boolean; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#93B5D4' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: '#F87171' }}>*</span>}
        {optional && <span className="font-normal ml-1" style={{ color: '#4A6888' }}>(선택사항)</span>}
      </label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#F87171' }}>{error}</p>}
    </div>
  )
}
