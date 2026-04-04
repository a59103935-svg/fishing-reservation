'use client'

interface BusSeatMapProps {
  totalSeats: number
  reservedSeats: string[]
  blockedSeats: string[]
  selectedSeats: number[]
  onToggle: (seatNumber: number) => void
}

export default function BusSeatMap({
  totalSeats,
  reservedSeats,
  blockedSeats,
  selectedSeats,
  onToggle,
}: BusSeatMapProps) {
  const unavailable = new Set([...reservedSeats, ...blockedSeats])
  const remaining = totalSeats - reservedSeats.length - blockedSeats.length

  function getStatus(num: number): 'available' | 'selected' | 'taken' {
    if (selectedSeats.includes(num)) return 'selected'
    if (unavailable.has(String(num))) return 'taken'
    return 'available'
  }

  const SEAT_SIZE = 64

  function Seat({ num }: { num: number }) {
    const status = getStatus(num)
    const base: React.CSSProperties = {
      width: SEAT_SIZE,
      height: SEAT_SIZE,
      borderRadius: 14,
      border: '2px solid',
      fontSize: 18,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.15s',
      userSelect: 'none',
    }

    if (status === 'taken') {
      return (
        <div style={{ ...base, background: '#1A2A3A', borderColor: '#2D3748', cursor: 'not-allowed' }}>
          <span style={{ color: '#3A4F66', fontSize: 20, fontWeight: 900 }}>✕</span>
        </div>
      )
    }
    if (status === 'selected') {
      return (
        <button
          style={{
            ...base,
            background: '#C9A84C',
            borderColor: '#A8892A',
            color: '#0D1F35',
            boxShadow: '0 0 16px rgba(201,168,76,0.5)',
          }}
          onClick={() => onToggle(num)}
        >
          {num}
        </button>
      )
    }
    return (
      <button
        style={{ ...base, background: '#1E3F66', borderColor: '#2D5F99', color: '#93C5FD' }}
        onClick={() => onToggle(num)}
      >
        {num}
      </button>
    )
  }

  const mainRows = Array.from({ length: 8 }, (_, i) => {
    const base = i * 3 + 3
    return [base, base + 1, base + 2]
  })

  return (
    <div style={{ background: '#0F1E30', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', overflow: 'hidden' }}>
      {/* 잔여 좌석 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: '#0D1F35', borderBottom: '1px solid rgba(45,95,153,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ color: '#93B5D4' }}>전체 <b style={{ color: '#F8F9FA' }}>{totalSeats}석</b></span>
          <span style={{ color: '#2D4A66' }}>|</span>
          <span style={{ fontWeight: 700, color: remaining <= 5 ? '#F87171' : '#C9A84C' }}>잔여 {remaining}석</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#4A6888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#1E3F66', border: '2px solid #2D5F99' }} />빈자리
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#C9A84C' }} />선택
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#1A2A3A', border: '2px solid #2D3748' }} />예약
          </span>
        </div>
      </div>

      {/* 버스 내부 */}
      <div style={{ padding: '20px 16px', background: '#0F1E30' }}>
        {/* 운전석 + 출입구 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed rgba(45,95,153,0.4)',
        }}>
          <div style={{
            width: 56, height: 36, background: '#1A2A3A', borderRadius: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            border: '1px solid #2D3748',
          }}>
            <span style={{ fontSize: 16 }}>🚌</span>
            <span style={{ fontSize: 9, color: '#4A6888', fontWeight: 600 }}>운전석</span>
          </div>
          <div style={{
            width: 56, height: 36, background: 'rgba(201,168,76,0.1)', borderRadius: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            border: '1px solid rgba(201,168,76,0.3)',
          }}>
            <span style={{ fontSize: 9, color: '#C9A84C', fontWeight: 700 }}>출입구</span>
            <span style={{ fontSize: 9, color: '#C9A84C', fontWeight: 600 }}>→</span>
          </div>
        </div>

        {/* 앞쪽 2석 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Seat num={1} />
          <Seat num={2} />
          <div style={{ flex: 1 }} />
          <div style={{
            width: SEAT_SIZE, height: SEAT_SIZE, borderRadius: 14,
            background: 'rgba(201,168,76,0.08)', border: '1px dashed rgba(201,168,76,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.6)', fontWeight: 600 }}>출입구</span>
          </div>
        </div>

        {/* 본열 8행 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mainRows.map(([a, b, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Seat num={a} />
              <Seat num={b} />
              <div style={{ flex: 1 }} />
              <Seat num={c} />
            </div>
          ))}
        </div>

        {/* 뒷줄 4석 */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(45,95,153,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Seat num={27} />
            <Seat num={28} />
            <Seat num={29} />
            <Seat num={30} />
          </div>
        </div>
      </div>
    </div>
  )
}
