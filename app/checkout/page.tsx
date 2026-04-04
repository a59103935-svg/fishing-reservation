'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { calculateTotal, formatPrice, formatDateKorean } from '@/lib/booking'
import { savePending, clearPending } from '@/lib/pendingReservation'
import type { SiteSettings, PaymentMethod } from '@/types'

const PAYMENT_LABELS: Record<string, string> = {
  kakao: '카카오페이',
  naver: '네이버페이',
  bank: '무통장입금',
  onsite: '현장결제',
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { selectedDate, selectedBusSeats, selectedBoatSpots, cartItems, customerName, customerPhone, paymentMethod, depositorName, setCustomerInfo, setPaymentMethod, setDepositorName } = useBookingStore()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [nameErr, setNameErr] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [showBackModal, setShowBackModal] = useState(false)

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*').single()
    if (data) setSettings(data)
  }, [supabase])

  // 리다이렉트 + 초기 로드
  useEffect(() => {
    if (!selectedDate || selectedBusSeats.length === 0) { router.replace('/'); return }
    loadSettings()
  }, [selectedDate, selectedBusSeats, router, loadSettings])

  // localStorage 저장 — 날짜/좌석/결제방식 변경 시마다 갱신
  useEffect(() => {
    if (!selectedDate || selectedBusSeats.length === 0) return
    savePending({ date: selectedDate, busSeats: selectedBusSeats, boatSpots: selectedBoatSpots, paymentMethod })
  }, [selectedDate, selectedBusSeats, selectedBoatSpots, paymentMethod])

  // 브라우저 뒤로가기 인터셉트
  // guardPushed ref 제거 — Strict Mode cleanup/re-run 후에도 리스너가 재등록되어야 함
  // URL 파라미터 생략(빈 문자열) — Next.js router의 pushState 패치가 URL 변경으로 오인식하지 않도록
  useEffect(() => {
    window.history.pushState(null, '')

    function onPopState() {
      window.history.pushState(null, '')
      setShowBackModal(true)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const total = settings ? calculateTotal(selectedBusSeats.length, selectedBoatSpots.length > 0, cartItems, settings) : 0

  function copyAccount(account: string) {
    navigator.clipboard.writeText(account).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function validateForm(): boolean {
    let valid = true
    if (!customerName.trim()) { setNameErr('이름을 입력해 주세요'); valid = false } else { setNameErr('') }
    const phoneClean = customerPhone.replace(/\D/g, '')
    if (!phoneClean || phoneClean.length < 10) { setPhoneErr('올바른 전화번호를 입력해 주세요'); valid = false } else { setPhoneErr('') }
    return valid
  }

  async function handleSubmit() {
    if (!validateForm() || loading) return
    setLoading(true)
    try {
      if (paymentMethod === 'kakao') {
        const res = await fetch('/api/payments/kakao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: selectedDate, customerName, customerPhone, busSeatNumber: selectedBusSeats, boatSpotId: selectedBoatSpots.join(','), cartItems, totalAmount: total, paymentMethod, depositorName }) })
        const data = await res.json()
        if (data.redirect_url) { clearPending(); window.location.href = data.redirect_url }
        else alert('카카오페이 결제 준비 중 오류가 발생했습니다')
      } else if (paymentMethod === 'naver') {
        const res = await fetch('/api/payments/naver', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: selectedDate, customerName, customerPhone, busSeatNumber: selectedBusSeats, boatSpotId: selectedBoatSpots.join(','), cartItems, totalAmount: total, paymentMethod }) })
        const data = await res.json()
        if (data.redirect_url) { clearPending(); window.location.href = data.redirect_url }
        else alert('네이버페이 결제 준비 중 오류가 발생했습니다')
      } else {
        const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: selectedDate, customerName, customerPhone, busSeatNumber: selectedBusSeats, boatSpotId: selectedBoatSpots.join(','), cartItems, totalAmount: total, paymentMethod, depositorName }) })
        const data = await res.json()
        if (data.id) { clearPending(); router.push(`/confirmation/${data.id}`) }
        else alert(data.error ?? '예약 처리 중 오류가 발생했습니다')
      }
    } catch (err) { console.error(err); alert('네트워크 오류가 발생했습니다.') }
    finally { setLoading(false) }
  }

  const paymentMethods: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
    { id: 'kakao', label: '카카오페이', icon: '💛', desc: '카카오페이로 간편 결제' },
    { id: 'naver', label: '네이버페이', icon: '💚', desc: '네이버페이로 간편 결제' },
    { id: 'bank', label: '무통장입금', icon: '🏦', desc: '입금 확인 후 예약 확정' },
    { id: 'onsite', label: '현장결제', icon: '💵', desc: '당일 현장에서 결제' },
  ]

  if (!selectedDate) return null

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 pb-32">

      {/* 뒤로가기 모달 */}
      {showBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold text-gray-900">이미 예약이 진행 중입니다</h2>
              <p className="text-sm text-gray-500 mt-1">{PAYMENT_LABELS[paymentMethod]}으로 진행 중이었습니다</p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl active:scale-95 transition-all"
                onClick={() => setShowBackModal(false)}
              >
                이어서 진행
              </button>
              <button
                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl active:scale-95 transition-all"
                onClick={() => { setPaymentMethod('kakao'); setShowBackModal(false) }}
              >
                결제방식 변경
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center px-4 py-4 gap-3">
          <button onClick={() => setShowBackModal(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">←</button>
          <div><p className="text-xs text-gray-500">결제</p><p className="text-base font-bold text-gray-900">예약 정보 확인</p></div>
        </div>
      </header>
      <div className="px-4 py-4 space-y-4">
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3 text-base">예약 내용</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">출조일</span><span className="font-semibold">{formatDateKorean(selectedDate)}</span></div>
            {settings && <div className="flex justify-between"><span className="text-gray-500">출발 시간</span><span className="font-semibold">{settings.departure_time.slice(0,5)} 출발</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">버스 좌석</span><span className="font-semibold">{selectedBusSeats.join(', ')}번석</span></div>
            {selectedBoatSpots.length > 0 && <div className="flex justify-between"><span className="text-gray-500">배 자리</span><span className="font-semibold">{selectedBoatSpots.join(', ')}번</span></div>}
          </div>
        </div>
        {cartItems.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-3 text-base">낚시용품</h2>
            <div className="space-y-2">{cartItems.map(item => <div key={item.product.id} className="flex justify-between text-sm"><span className="text-gray-700">{item.product.name} × {item.quantity}</span><span className="font-semibold">{(item.product.price * item.quantity).toLocaleString()}원</span></div>)}</div>
          </div>
        )}
        {settings && (
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-3 text-base">결제 금액</h2>
            <div className="space-y-2 text-sm">
              {selectedBusSeats.length > 0 && <div className="flex justify-between"><span className="text-gray-500">버스 요금 ({selectedBusSeats.length}석)</span><span>{formatPrice(settings.bus_price * selectedBusSeats.length)}</span></div>}
              {selectedBoatSpots.length > 0 && <div className="flex justify-between"><span className="text-gray-500">배 자리 요금 ({selectedBoatSpots.length}자리)</span><span>{formatPrice(settings.boat_price * selectedBoatSpots.length)}</span></div>}
              {cartItems.map(item => <div key={item.product.id} className="flex justify-between text-xs text-gray-400"><span>{item.product.name} × {item.quantity}</span><span>{(item.product.price * item.quantity).toLocaleString()}원</span></div>)}
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="font-bold text-gray-800">총 결제 금액</span><span className="font-bold text-blue-600 text-lg">{formatPrice(total)}</span></div>
            </div>
          </div>
        )}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3 text-base">고객 정보</h2>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label><input type="text" className="form-input" placeholder="홍길동" value={customerName} onChange={e => setCustomerInfo(e.target.value, customerPhone)} />{nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">전화번호 <span className="text-red-500">*</span></label><input type="tel" className="form-input" placeholder="010-1234-5678" value={customerPhone} onChange={e => setCustomerInfo(customerName, e.target.value)} inputMode="tel" />{phoneErr && <p className="text-red-500 text-xs mt-1">{phoneErr}</p>}</div>
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3 text-base">결제 수단</h2>
          <div className="space-y-2">
            {paymentMethods.map(method => (
              <button key={method.id} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`} onClick={() => setPaymentMethod(method.id)}>
                <span className="text-2xl">{method.icon}</span>
                <div className="text-left flex-1"><p className="font-semibold text-gray-800">{method.label}</p><p className="text-xs text-gray-500">{method.desc}</p></div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>{paymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}</div>
              </button>
            ))}
          </div>
        </div>
        {paymentMethod === 'bank' && settings && (
          <div className="card border-blue-200">
            <h3 className="font-bold text-blue-800 mb-3">무통장 입금 안내</h3>
            <div className="bg-blue-50 rounded-xl p-3 space-y-2 text-sm mb-3">
              <div className="flex justify-between items-center"><span className="text-gray-500">은행</span><span className="font-semibold text-gray-800">신한은행</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">계좌번호</span>
                <button onClick={() => copyAccount(settings.bank_account)} className="flex items-center gap-1.5 font-semibold text-blue-700 active:scale-95 transition-all">
                  <span>{settings.bank_account}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: copied ? '#22c55e' : '#DBEAFE', color: copied ? 'white' : '#1D4ED8' }}>{copied ? '복사됨!' : '복사'}</span>
                </button>
              </div>
              <div className="flex justify-between items-center"><span className="text-gray-500">예금주</span><span className="font-semibold text-gray-800">강현구</span></div>
              <div className="flex justify-between items-center border-t border-blue-200 pt-2"><span className="text-gray-500">입금액</span><span className="text-blue-700 font-bold text-base">{formatPrice(total)}</span></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">입금자명 <span className="text-red-500">*</span></label><input type="text" className="form-input" placeholder="입금하실 이름을 입력하세요" value={depositorName} onChange={e => setDepositorName(e.target.value)} /></div>
            <p className="text-xs text-gray-500 mt-2">* 입금 확인 후 예약이 확정됩니다 (확인 최대 1시간 소요)</p>
          </div>
        )}
        {paymentMethod === 'onsite' && (
          <div className="card border-yellow-200 bg-yellow-50">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ 현장결제 주의사항</h3>
            <ul className="text-sm text-yellow-800 space-y-1"><li>• 출발 30분 전까지 반드시 도착해 주세요</li><li>• 당일 취소 시 환불 불가합니다</li><li>• 현금/카드 모두 결제 가능합니다</li></ul>
          </div>
        )}
      </div>
      <div className="bottom-bar">
        <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">총 결제 금액</span><span className="text-xl font-bold text-blue-600">{formatPrice(total)}</span></div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />처리 중...</span> : `${total.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </div>
  )
}
