'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isBefore } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import type { SiteSettings } from '@/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [form, setForm] = useState({
    site_name: '',
    bus_total_seats: '30',
    boat_total_spots: '20',
    bus_price: '50000',
    boat_price: '30000',
    departure_time: '05:00',
    return_time: '14:00',
    bank_name: '',
    bank_account: '',
    bank_holder: '',
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // 달력 상태
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [holidays, setHolidays] = useState<Set<string>>(new Set())

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*').single()
    if (data) {
      setSettings(data)
      setForm({
        site_name: data.site_name,
        bus_total_seats: String(data.bus_total_seats),
        boat_total_spots: String(data.boat_total_spots),
        bus_price: String(data.bus_price),
        boat_price: String(data.boat_price),
        departure_time: data.departure_time.slice(0, 5),
        return_time: data.return_time.slice(0, 5),
        bank_name: data.bank_name,
        bank_account: data.bank_account,
        bank_holder: data.bank_holder,
      })
    }
  }, [supabase])

  const loadHolidays = useCallback(async (month: Date) => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('schedule_settings')
      .select('date')
      .eq('is_holiday', true)
      .gte('date', start)
      .lte('date', end)

    const set = new Set<string>()
    data?.forEach((d) => set.add(d.date))
    setHolidays(set)
  }, [supabase])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    loadHolidays(currentMonth)
  }, [currentMonth, loadHolidays])

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    setSavedMsg('')
    try {
      const payload = {
        id: settings.id,
        site_name: form.site_name,
        bus_total_seats: Number(form.bus_total_seats),
        boat_total_spots: Number(form.boat_total_spots),
        bus_price: Number(form.bus_price),
        boat_price: Number(form.boat_price),
        departure_time: form.departure_time + ':00',
        return_time: form.return_time + ':00',
        bank_name: form.bank_name,
        bank_account: form.bank_account,
        bank_holder: form.bank_holder,
        updated_at: new Date().toISOString(),
      }
      const { error, count } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'id' })
        .select()

      if (error) throw error
      setSavedMsg('✓ 저장됐습니다')
      await loadSettings()
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err) {
      console.error('saveSettings error:', err)
      alert('저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  async function toggleHoliday(dateStr: string) {
    const isHoliday = holidays.has(dateStr)

    if (isHoliday) {
      await supabase
        .from('schedule_settings')
        .delete()
        .eq('date', dateStr)
        .eq('is_holiday', true)
      const newSet = new Set(holidays)
      newSet.delete(dateStr)
      setHolidays(newSet)
    } else {
      await supabase.from('schedule_settings').upsert({
        date: dateStr,
        is_holiday: true,
        bus_total_seats: Number(form.bus_total_seats),
        boat_total_spots: Number(form.boat_total_spots),
        bus_price: Number(form.bus_price),
        boat_price: Number(form.boat_price),
        departure_time: form.departure_time + ':00',
        return_time: form.return_time + ':00',
      })
      const newSet = new Set(holidays)
      newSet.add(dateStr)
      setHolidays(newSet)
    }
  }

  // 달력 날짜 배열
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const weeks: Date[][] = []
  let week: Date[] = []
  let cur = calStart
  while (cur <= calEnd) {
    week.push(new Date(cur))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
    cur = addDays(cur, 1)
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">출조 설정</h1>

      {/* 기본 설정 */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">기본 정보</h2>

        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>업체명</label>
          <input
            type="text"
            className="form-input"
            value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            placeholder="행복낚시 출조 예약"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>
              버스 총 좌석 수
            </label>
            <input
              type="number"
              className="form-input"
              value={form.bus_total_seats}
              onChange={(e) => setForm({ ...form, bus_total_seats: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>
              배 총 자리 수
            </label>
            <input
              type="number"
              className="form-input"
              value={form.boat_total_spots}
              onChange={(e) => setForm({ ...form, boat_total_spots: e.target.value })}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>
              버스요금 (원)
            </label>
            <input
              type="number"
              className="form-input"
              value={form.bus_price}
              onChange={(e) => setForm({ ...form, bus_price: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>
              배삯 (원)
            </label>
            <input
              type="number"
              className="form-input"
              value={form.boat_price}
              onChange={(e) => setForm({ ...form, boat_price: e.target.value })}
              inputMode="numeric"
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
          <span className="text-sm font-semibold text-gray-600">총 비용 (1인당)</span>
          <span className="text-base font-black text-blue-600">
            {(Number(form.bus_price || 0) + Number(form.boat_price || 0)).toLocaleString()}원
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>
              출발 시간
            </label>
            <input
              type="time"
              className="form-input"
              value={form.departure_time}
              onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>
              귀항 시간
            </label>
            <input
              type="time"
              className="form-input"
              value={form.return_time}
              onChange={(e) => setForm({ ...form, return_time: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 계좌 정보 */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">무통장 입금 계좌</h2>
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>은행명</label>
          <input
            type="text"
            className="form-input"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            placeholder="예: 국민은행"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>계좌번호</label>
          <input
            type="text"
            className="form-input"
            value={form.bank_account}
            onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
            placeholder="예: 123-456-789012"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: '#C9A84C' }}>예금주</label>
          <input
            type="text"
            className="form-input"
            value={form.bank_holder}
            onChange={(e) => setForm({ ...form, bank_holder: e.target.value })}
            placeholder="예: 홍길동"
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <div>
        <button
          className="btn-primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? '저장 중...' : '설정 저장하기'}
        </button>
        {savedMsg && (
          <p className="text-center text-green-600 font-semibold mt-2">{savedMsg}</p>
        )}
      </div>

      {/* 휴무 설정 달력 */}
      <div className="card">
        <h2 className="font-bold text-gray-800 text-lg mb-4">휴무일 설정</h2>
        <p className="text-sm text-gray-500 mb-4">
          날짜를 클릭하면 휴무 설정/해제됩니다.
          <span className="ml-1 text-red-500 font-medium">빨간색 = 휴무</span>
        </p>

        {/* 달력 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <button
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            ‹
          </button>
          <span className="font-bold text-gray-800">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <button
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            ›
          </button>
        </div>

        {/* 요일 */}
        <div className="grid grid-cols-7 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-semibold py-1">
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const inMonth = isSameMonth(day, currentMonth)
                const isHoliday = holidays.has(dateStr)

                return (
                  <button
                    key={dateStr}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      !inMonth
                        ? 'opacity-0 pointer-events-none'
                        : isHoliday
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => inMonth && toggleHoliday(dateStr)}
                    disabled={!inMonth}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {holidays.size > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-xl">
            <p className="text-xs font-semibold text-red-700 mb-1">설정된 휴무일</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(holidays).sort().map((d) => (
                <span key={d} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
