'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isBefore, isToday, parseISO,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/booking'
import TideWeatherSection from '@/components/TideWeatherSection'
import type { SiteSettings, Product } from '@/types'

interface DayStatus {
  date: string
  reservedCount: number
  isHoliday: boolean
  totalSeats: number
}

const NOTICES = [
  { date: '2025.12.01', title: '12월 출조 일정 안내' },
  { date: '2025.11.28', title: '겨울 방한복 무료 대여 이벤트' },
  { date: '2025.11.20', title: '연말 단체 예약 특가 안내' },
]
const FISHING_REPORTS = [
  { date: '2025.12.01', title: '갈치 대조황 — 1인당 30마리 이상' },
  { date: '2025.11.29', title: '광어·우럭 풍성 — 날씨 최상' },
  { date: '2025.11.25', title: '참돔 시즌 본격 시작' },
]

export default function HomePage() {
  const router   = useRouter()
  const supabase = createClient()
  const bookingRef = useRef<HTMLDivElement>(null)

  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [dayStatuses,   setDayStatuses]   = useState<Map<string, DayStatus>>(new Map())
  const [siteSettings,  setSiteSettings]  = useState<SiteSettings | null>(null)
  const [calLoading,    setCalLoading]    = useState(true)
  const [selectedDay,   setSelectedDay]   = useState<string | null>(null)
  const [previewProducts, setPreviewProducts] = useState<Product[]>([])

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*').single()
    if (data) setSiteSettings(data)
  }, [supabase])

  const loadMonthData = useCallback(async (month: Date) => {
    setCalLoading(true)
    try {
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end   = format(endOfMonth(month),   'yyyy-MM-dd')
    const { data: bookingsRaw, error: bookingsError } = await supabase
      .from('bookings').select('date')
      .gte('date', start).lte('date', end)
    const bookings = bookingsError ? [] : (bookingsRaw ?? [])
    const { data: schedulesRaw, error: schedulesError } = await supabase
      .from('schedule_settings').select('date, is_holiday')
      .gte('date', start).lte('date', end)
    const schedules = schedulesError ? [] : (schedulesRaw ?? [])
    const totalSeats = siteSettings?.bus_total_seats ?? 30
    const statusMap  = new Map<string, DayStatus>()
    const counts     = new Map<string, number>()
    bookings.forEach((b) => { counts.set(b.date, (counts.get(b.date) ?? 0) + 1) })
    const holidays = new Set(schedules?.filter((s) => s.is_holiday).map((s) => s.date))
    let cur = new Date(start)
    while (cur <= new Date(end)) {
      const ds = format(cur, 'yyyy-MM-dd')
      statusMap.set(ds, { date: ds, reservedCount: counts.get(ds) ?? 0, isHoliday: holidays.has(ds), totalSeats })
      cur = addDays(cur, 1)
    }
    setDayStatuses(statusMap)
    } catch {
      // 테이블 미존재 등 예외 시 캘린더는 빈 상태로 표시
    } finally {
      setCalLoading(false)
    }
  }, [supabase, siteSettings?.bus_total_seats])

  const loadPreviewProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('sort_order').limit(4)
    if (!error && data) setPreviewProducts(data)
  }, [supabase])

  useEffect(() => { loadSettings() }, [loadSettings])
  useEffect(() => { loadMonthData(currentMonth) }, [currentMonth, loadMonthData])
  useEffect(() => { loadPreviewProducts() }, [loadPreviewProducts])

  function getDayClass(dateStr: string, inMonth: boolean) {
    const today = new Date(); today.setHours(0,0,0,0)
    const d = parseISO(dateStr)
    if (!inMonth) return 'calendar-day opacity-0 pointer-events-none'
    if (isBefore(d, today)) return 'calendar-day past'
    const s = dayStatuses.get(dateStr)
    if (!s) return 'calendar-day available'
    if (s.isHoliday) return 'calendar-day holiday'
    const r = s.reservedCount / s.totalSeats
    if (r >= 1) return 'calendar-day full'
    if (r >= 0.8) return 'calendar-day almost-full'
    return 'calendar-day available'
  }

  function getDayStatusText(dateStr: string) {
    const s = dayStatuses.get(dateStr)
    if (!s) return ''
    if (s.isHoliday) return '휴무'
    const r = s.totalSeats - s.reservedCount
    if (r <= 0) return '마감'
    if (r <= 5) return `${r}석`
    return ''
  }

  function handleDayClick(dateStr: string, inMonth: boolean) {
    if (!inMonth) return
    const today = new Date(); today.setHours(0,0,0,0)
    if (isBefore(parseISO(dateStr), today)) return
    const s = dayStatuses.get(dateStr)
    if (s?.isHoliday || (s && s.reservedCount >= s.totalSeats)) return
    setSelectedDay(dateStr)
  }

  const monthStart = startOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd     = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
  const weeks: Date[][] = []
  let week: Date[] = []
  let cur = calStart
  while (cur <= calEnd) {
    week.push(new Date(cur))
    if (week.length === 7) { weeks.push(week); week = [] }
    cur = addDays(cur, 1)
  }

  const selectedStatus = selectedDay ? dayStatuses.get(selectedDay) : null
  const remainingSeats = selectedStatus ? selectedStatus.totalSeats - selectedStatus.reservedCount : 0

  return (
    <div style={{ background: '#0D1F35' }}>

      {/* 오늘 출조 정보 */}
      <div className="pt-20 pb-0 mb-0">
        <TideWeatherSection />
      </div>

      {/* HERO */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-5 pt-4 mt-4 pb-24 overflow-hidden"
        style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0D1F35 0%, #0a1628 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, background: 'rgba(201,168,76,0.4)', top: `${Math.random() * 80}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.6 + 0.2 }} />
          ))}
        </div>
        <p className="text-xs font-semibold tracking-[0.3em] mb-4" style={{ color: '#C9A84C' }}>경남 최고의 선상낚시</p>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6 whitespace-pre-line" style={{ fontFamily: '"Noto Serif KR", Georgia, serif', color: '#F8F9FA' }}>
          {'좋은피싱과 함께\n특별한 하루를'}
        </h1>
        <p className="text-sm mb-10 max-w-xs" style={{ color: '#8A9BB0' }}>안전하고 풍성한 선상낚시 출조 — 버스·배 좌석 간편 예약</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button onClick={() => bookingRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 py-4 rounded-xl font-bold text-base transition-all active:scale-95" style={{ background: '#C9A84C', color: '#0D1F35', boxShadow: '0 4px 20px rgba(201,168,76,0.35)' }}>지금 예약하기</button>
          <button onClick={() => bookingRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex-1 py-4 rounded-xl font-bold text-base transition-all active:scale-95" style={{ background: 'transparent', color: '#C9A84C', border: '1.5px solid #C9A84C' }}>출조 일정 보기</button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: 60 }}>
          <div className="wave-animate" style={{ width: '200%', display: 'flex' }}>
            <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ width: '50%', height: 60 }}><path d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z" fill="#0D1F35" /></svg>
            <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{ width: '50%', height: 60 }}><path d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z" fill="#0D1F35" /></svg>
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" ref={bookingRef} style={{ background: '#0D1F35', padding: '72px 0' }}>
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#C9A84C' }}>RESERVATION</p>
            <h2 className="text-3xl font-black" style={{ fontFamily: '"Noto Serif KR", Georgia, serif', color: '#F8F9FA' }}>출조 일정 예약</h2>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-card" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-90" style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}>‹</button>
              <h3 className="text-base font-bold" style={{ color: '#F8F9FA' }}>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-90" style={{ background: 'rgba(45,95,153,0.3)', color: '#93C5FD' }}>›</button>
            </div>
            <div className="grid grid-cols-7 px-4 pt-3">
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: i === 0 ? '#F87171' : i === 6 ? '#93C5FD' : '#4A6888' }}>{d}</div>
              ))}
            </div>
            <div className="px-4 pb-4">
              {calLoading ? (
                <div className="grid grid-cols-7 gap-1">{Array.from({ length: 35 }).map((_, i) => <div key={i} className="aspect-square rounded-xl skeleton" />)}</div>
              ) : (
                <div className="space-y-1">
                  {weeks.map((wk, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1">
                      {wk.map((day) => {
                        const ds = format(day, 'yyyy-MM-dd')
                        const inM = isSameMonth(day, currentMonth)
                        const cls = getDayClass(ds, inM)
                        const st  = getDayStatusText(ds)
                        const dow = day.getDay()
                        const isSel = ds === selectedDay
                        return (
                          <button key={ds} className={`${cls} ${isToday(day) ? 'today' : ''} relative`} style={isSel ? { outline: '2px solid #C9A84C', outlineOffset: 1 } : undefined} onClick={() => handleDayClick(ds, inM)}>
                            <span className="text-sm font-semibold" style={{ color: dow === 0 && inM ? '#F87171' : undefined }}>{day.getDate()}</span>
                            {st && <span className="text-[9px] leading-none mt-0.5 font-medium">{st}</span>}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 px-5 py-3" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
              {[
                { color: 'rgba(201,168,76,0.25)', border: 'rgba(201,168,76,0.4)', label: '예약 가능' },
                { color: 'rgba(220,100,50,0.25)',  border: 'rgba(220,100,50,0.4)',  label: '마감 임박' },
                { color: '#111E2E',                border: '#1E2D40',               label: '마감/휴무' },
              ].map(({ color, border, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: color, border: `1px solid ${border}` }} />
                  <span className="text-[10px]" style={{ color: '#4A6888' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          {selectedDay && (
            <div className="mt-4 rounded-2xl px-5 py-4 shadow-card" style={{ background: '#1A3355', borderLeft: '4px solid #C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: '#8A9BB0' }}>선택된 출조일</p>
                  <p className="text-lg font-black" style={{ color: '#F8F9FA' }}>{format(parseISO(selectedDay), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: remainingSeats > 5 ? 'rgba(201,168,76,0.15)' : 'rgba(220,100,50,0.15)', color: remainingSeats > 5 ? '#C9A84C' : '#E8905A' }}>잔여 {remainingSeats}석</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {siteSettings && [
                  { label: '출발', value: siteSettings.departure_time.slice(0,5) },
                  { label: '귀항', value: siteSettings.return_time.slice(0,5) },
                  { label: '버스요금', value: `${siteSettings.bus_price.toLocaleString()}원` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center py-2 rounded-xl" style={{ background: 'rgba(13,31,53,0.5)' }}>
                    <p className="text-[10px] mb-0.5" style={{ color: '#8A9BB0' }}>{label}</p>
                    <p className="text-sm font-bold" style={{ color: '#F8F9FA' }}>{value}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push(`/booking/${selectedDay}`)} className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-95" style={{ background: '#C9A84C', color: '#0D1F35', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>이 날짜로 예약하기 →</button>
            </div>
          )}
          {!selectedDay && <p className="text-center mt-4 text-sm" style={{ color: '#4A6888' }}>날짜를 선택하면 출조 정보가 표시됩니다</p>}
        </div>
      </section>

      <div className="gold-divider" />

      {/* 특징 섹션 */}
      <section style={{ background: '#0a1628', padding: '72px 0' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#C9A84C' }}>WHY CHOOSE US</p>
            <h2 className="text-3xl font-black" style={{ fontFamily: '"Noto Serif KR", Georgia, serif', color: '#F8F9FA' }}>좋은피싱을 선택하는 이유</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '⚓', title: '안전한 출조', desc: '최신 안전장비를 갖춘 선박으로 안전한 출조 환경을 제공합니다.' },
              { icon: '🎣', title: '풍성한 출조', desc: '최고의 포인트만 찾아갑니다. 베테랑 선장의 노하우로 풍성한 손맛을 보장합니다.' },
              { icon: '🚌', title: '편리한 이동', desc: '30인승 버스로 편안하게 이동하여 현장에서 바로 낚시를 즐기세요.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 text-center transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #1A3355 0%, #0D1F35 100%)', border: '1px solid rgba(201,168,76,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', cursor: 'default' }} onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.5)')} onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.15)')}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>{icon}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#F8F9FA' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#8A9BB0' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* 낚시용품 SHOP */}
      <section style={{ background: '#0D1F35', padding: '72px 0' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#C9A84C' }}>FISHING SHOP</p>
              <h2 className="text-2xl font-black" style={{ fontFamily: '"Noto Serif KR", Georgia, serif', color: '#F8F9FA' }}>출조 전 필요한 용품을<br />미리 준비하세요</h2>
            </div>
            <Link href="/shop" className="text-sm font-semibold shrink-0" style={{ color: '#C9A84C', borderBottom: '1px solid rgba(201,168,76,0.4)' }}>전체 상품 보기 →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {previewProducts.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl overflow-hidden skeleton" style={{ height: 200 }} />)
              : previewProducts.map((product) => (
                <Link key={product.id} href={`/shop/${product.id}`} className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }} onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid rgba(201,168,76,0.15)')}>
                  <div className="aspect-square flex items-center justify-center" style={{ background: '#0F1E30' }}>
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <svg viewBox="0 0 24 24" fill="none" stroke="rgba(45,95,153,0.4)" strokeWidth="1.5" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <p className="text-xs font-semibold line-clamp-2 leading-snug" style={{ color: '#F8F9FA' }}>{product.name}</p>
                    <p className="text-sm font-black mt-auto" style={{ color: '#C9A84C' }}>{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* 공지 / 조황 */}
      <section id="notices" style={{ background: '#0a1628', padding: '72px 0' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#C9A84C' }}>NEWS</p>
            <h2 className="text-3xl font-black" style={{ fontFamily: '"Noto Serif KR", Georgia, serif', color: '#F8F9FA' }}>공지사항 · 조황정보</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #1A3355 0%, #0D1F35 100%)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: '#C9A84C' }}>공지사항</h3>
                <span className="text-xs" style={{ color: '#4A6888' }}>더보기 →</span>
              </div>
              <ul className="space-y-3">
                {NOTICES.map(({ date, title }) => (
                  <li key={date} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#C9A84C' }} />
                    <div><p className="text-xs mb-0.5" style={{ color: '#8A9BB0' }}>{date}</p><p className="text-sm font-medium" style={{ color: '#F8F9FA' }}>{title}</p></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #1A3355 0%, #0D1F35 100%)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: '#C9A84C' }}>최근 조황</h3>
                <span className="text-xs" style={{ color: '#4A6888' }}>더보기 →</span>
              </div>
              <ul className="space-y-3">
                {FISHING_REPORTS.map(({ date, title }) => (
                  <li key={date} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#C9A84C' }} />
                    <div><p className="text-xs mb-0.5" style={{ color: '#8A9BB0' }}>{date}</p><p className="text-sm font-medium" style={{ color: '#F8F9FA' }}>{title}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
