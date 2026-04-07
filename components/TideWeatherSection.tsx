'use client'

import { useState, useEffect } from 'react'
import { addDays, format } from 'date-fns'
import { ko } from 'date-fns/locale'

const LOCATIONS = [
  { name: '여수', lat: 34.7604, lon: 127.6622 },
  { name: '영덕', lat: 36.4153, lon: 129.3664 },
  { name: '진해', lat: 35.1398, lon: 128.6810 },
]

const DATE_TABS = [
  { label: '오늘', offset: 0 },
  { label: '내일', offset: 1 },
  { label: '모레', offset: 2 },
  { label: '3일 후', offset: 3 },
]

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
}

function getLunarDay(date: Date): number {
  const lunarBase = new Date(2000, 0, 6)
  const diff = Math.floor((date.getTime() - lunarBase.getTime()) / (1000 * 60 * 60 * 24))
  return ((diff % 30) + 30) % 30 + 1
}

function getTideInfo(date: Date) {
  const lunarDay = getLunarDay(date)
  const mul = ((lunarDay - 1) % 15) + 1
  const mulNames = ['', '초하루', '두물', '세물', '네물', '다섯물', '여섯물', '일곱물', '여덟물', '아홉물', '열물', '열한물', '열두물', '열세물', '열네물', '보름']
  let typeLabel = ''
  if (mul <= 2) typeLabel = '조금'
  else if (mul <= 5) typeLabel = '소조'
  else if (mul <= 9) typeLabel = '중간사리'
  else if (mul <= 12) typeLabel = '대조'
  else if (mul <= 14) typeLabel = '사리'
  else typeLabel = '조금'
  return { mul, mulName: mulNames[mul] || `${mul}물`, typeLabel }
}

interface WeatherData {
  temp: number
  desc: string
  icon: string
  wind: number
  humidity: number
}

export default function TideWeatherSection() {
  const [locationIdx, setLocationIdx] = useState(0)
  const [dateOffset, setDateOffset] = useState(0)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  const targetDate = addDays(new Date(), dateOffset)
  const tide = getTideInfo(targetDate)
  const dateLabel = format(targetDate, 'M월 d일 (EEE)', { locale: ko })

  useEffect(() => {
    fetchWeather(locationIdx, dateOffset)
  }, [locationIdx, dateOffset])

  async function fetchWeather(locIdx: number, offset: number) {
    setLoading(true)
    setWeather(null)
    try {
      const { lat, lon } = LOCATIONS[locIdx]
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
      if (offset === 0) {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`
        )
        const data = await res.json()
        setWeather({
          temp: Math.round(data.main.temp),
          desc: data.weather[0].description,
          icon: data.weather[0].icon,
          wind: Math.round(data.wind.speed),
          humidity: data.main.humidity,
        })
      } else {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`
        )
        const data = await res.json()
        const targetDateStr = format(addDays(new Date(), offset), 'yyyy-MM-dd')
        const entries: any[] = (data.list ?? []).filter((item: any) =>
          item.dt_txt?.startsWith(targetDateStr)
        )
        if (entries.length === 0) throw new Error('no data')
        const noon = entries.find((e: any) => e.dt_txt?.includes('12:00:00')) ?? entries[Math.floor(entries.length / 2)]
        setWeather({
          temp: Math.round(noon.main.temp),
          desc: noon.weather[0].description,
          icon: noon.weather[0].icon,
          wind: Math.round(noon.wind.speed),
          humidity: noon.main.humidity,
        })
      }
    } catch {
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ background: '#0D1F35', padding: '20px 0 12px 0' }}>
      <div className="max-w-2xl mx-auto px-4">
        {/* 섹션 타이틀 */}
        <div className="text-center mb-4">
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C9A84C' }}>WEATHER & TIDE</p>
          <h2 className="text-xl font-black" style={{ color: '#F8F9FA' }}>날씨 · 물때</h2>
        </div>

        {/* 날짜 탭 */}
        <div className="flex gap-1.5 mb-2 justify-center">
          {DATE_TABS.map(({ label, offset }) => (
            <button
              key={offset}
              onClick={() => setDateOffset(offset)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
              style={{
                background: dateOffset === offset ? '#C9A84C' : 'rgba(30,63,102,0.6)',
                color: dateOffset === offset ? '#0D1F35' : '#4A6888',
                border: dateOffset === offset ? 'none' : '1px solid rgba(45,95,153,0.3)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 날짜 표시 */}
        <p className="text-center text-xs mb-3" style={{ color: '#4A6888' }}>{dateLabel}</p>

        {/* 지역 탭 */}
        <div className="flex gap-2 mb-4 justify-center">
          {LOCATIONS.map((loc, i) => (
            <button
              key={loc.name}
              onClick={() => setLocationIdx(i)}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: locationIdx === i ? '#C9A84C' : 'rgba(30,63,102,0.6)',
                color: locationIdx === i ? '#0D1F35' : '#4A6888',
                border: locationIdx === i ? 'none' : '1px solid rgba(45,95,153,0.3)',
              }}
            >
              {loc.name}
            </button>
          ))}
        </div>

        {/* 정보 카드 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 물때 카드 */}
          <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(201,168,76,0.2)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#C9A84C' }}>🌊 물때</p>
            <p className="text-2xl font-black mb-1" style={{ color: '#F8F9FA' }}>{tide.mul}물</p>
            <p className="text-sm font-semibold" style={{ color: '#93B5D4' }}>{tide.typeLabel}</p>
            <p className="text-xs mt-2" style={{ color: '#4A6888' }}>{tide.mulName}</p>
          </div>

          {/* 날씨 카드 */}
          <div className="rounded-2xl p-4" style={{ background: '#1A3355', border: '1px solid rgba(45,95,153,0.3)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#C9A84C' }}>⛅ 날씨</p>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-16 rounded mb-1" style={{ background: 'rgba(45,95,153,0.3)' }} />
                <div className="h-4 w-20 rounded" style={{ background: 'rgba(45,95,153,0.2)' }} />
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{WEATHER_ICONS[weather.icon] ?? '🌤️'}</span>
                  <span className="text-2xl font-black" style={{ color: '#F8F9FA' }}>{weather.temp}°C</span>
                </div>
                <p className="text-sm" style={{ color: '#93B5D4' }}>{weather.desc}</p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color: '#4A6888' }}>
                  <span>💨 {weather.wind}m/s</span>
                  <span>💧 {weather.humidity}%</span>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: '#4A6888' }}>날씨 정보 없음</p>
            )}
          </div>
        </div>

        {/* 출조 추천 메시지 */}
        {weather && (
          <div
            className="mt-3 rounded-xl px-4 py-3 text-center text-sm font-semibold"
            style={{
              background: weather.wind <= 5 ? 'rgba(201,168,76,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${weather.wind <= 5 ? 'rgba(201,168,76,0.3)' : 'rgba(248,113,113,0.3)'}`,
              color: weather.wind <= 5 ? '#C9A84C' : '#F87171',
            }}
          >
            {weather.wind <= 3
              ? '✅ 출조 최적 — 바다가 매우 잔잔해요'
              : weather.wind <= 5
              ? '✅ 출조 양호 — 낚시하기 좋은 날씨예요'
              : weather.wind <= 8
              ? '⚠️ 출조 주의 — 바람이 다소 강해요'
              : '❌ 출조 위험 — 강풍 주의보 확인 필요'}
          </div>
        )}
      </div>
    </section>
  )
}
