'use client'

interface BoatMapProps {
  totalSpots: number
  reservedSpots: string[]
  blockedSpots: string[]
  selectedSpots: string[]
  onToggle: (spot: string) => void
}

export default function BoatMap({
  totalSpots,
  reservedSpots,
  blockedSpots,
  selectedSpots,
  onToggle,
}: BoatMapProps) {
  const unavailable = new Set([...reservedSpots, ...blockedSpots])
  const remaining = totalSpots - reservedSpots.length - blockedSpots.length

  const rows = Array.from({ length: 8 }, (_, i) => ({
    left: String(i + 1),
    right: String(i + 9),
  }))

  function getStatus(id: string): 'available' | 'selected' | 'taken' {
    if (selectedSpots.includes(id)) return 'selected'
    if (unavailable.has(id)) return 'taken'
    return 'available'
  }

  const SPOT_SIZE = 64

  function Spot({ id }: { id: string }) {
    const status = getStatus(id)
    const base: React.CSSProperties = {
      width: SPOT_SIZE,
      height: SPOT_SIZE,
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
          onClick={() => onToggle(id)}
        >
          {id}
        </button>
      )
    }
    return (
      <button
        style={{ ...base, background: '#1E3F66', borderColor: '#2D5F99', color: '#93C5FD' }}
        onClick={() => onToggle(id)}
      >
        {id}
      </button>
    )
  }

  return (
    <div style={{ background: '#0F1E30', borderRadius: 20, border: '1px solid rgba(45,95,153,0.4)', overflow: 'hidden' }}>
      {/* 잔여 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: '#0D1F35', borderBottom: '1px solid rgba(45,95,153,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ color: '#93B5D4' }}>전체 <b style={{ color: '#F8F9FA' }}>{totalSpots}자리</b></span>
          <span style={{ color: '#2D4A66' }}>|</span>
          <span style={{ fontWeight: 700, color: remaining <= 3 ? '#F87171' : '#C9A84C' }}>잔여 {remaining}자리</span>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#4A6888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#1E3F66', border: '2px solid #2D5F99' }} />빈자리
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#C9A84C' }} />선택
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: '#1A2A3A' }} />예약
          </span>
        </div>
      </div>

      {/* 배 내부 */}
      <div style={{ padding: '20px 16px', background: '#0F1E30' }}>
        {/* 선수 (삼각형) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div style={{
            width: 0, height: 0,
            borderLeft: '70px solid transparent',
            borderRight: '70px solid transparent',
            borderBottom: '28px solid rgba(45,95,153,0.5)',
          }} />
        </div>

        {/* 배 외곽 */}
        <div style={{
          background: 'rgba(14,27,45,0.9)',
          borderRadius: '16px 16px 36px 36px',
          border: '2px solid rgba(45,95,153,0.5)',
          padding: '14px 16px 18px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.7)', fontWeight: 700, letterSpacing: 3 }}>선수 (앞)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(({ left, right }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spot id={left} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 2, height: SPOT_SIZE, background: 'rgba(45,95,153,0.4)', borderRadius: 2 }} />
                </div>
                <Spot id={right} />
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.7)', fontWeight: 700, letterSpacing: 3 }}>선미 (뒤)</span>
          </div>
        </div>

        {/* 선미 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <div style={{
            width: '80%', maxWidth: 200, height: 18,
            background: 'rgba(45,95,153,0.5)',
            borderRadius: '0 0 36px 36px',
            border: '2px solid rgba(45,95,153,0.4)',
            borderTop: 'none',
          }} />
        </div>
      </div>

      {/* 선택된 자리 */}
      {selectedSpots.length > 0 && (
        <div style={{
          padding: '10px 16px', background: '#0D1F35', borderTop: '1px solid rgba(45,95,153,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C' }}>
            {selectedSpots.join(', ')}번 선택됨
          </span>
          <button
            style={{ fontSize: 12, color: '#4A6888', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => selectedSpots.forEach((s) => onToggle(s))}
          >
            전체 취소
          </button>
        </div>
      )}
    </div>
  )
}
