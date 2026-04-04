export const PENDING_KEY = 'pending_reservation'

export interface PendingReservation {
  date: string
  busSeats: number[]
  boatSpots: string[]
  paymentMethod: string
}

export function savePending(data: PendingReservation): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(data)) } catch {}
}

export function getPending(): PendingReservation | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PendingReservation
    return data?.date && data?.busSeats?.length > 0 ? data : null
  } catch { return null }
}

export function clearPending(): void {
  try { localStorage.removeItem(PENDING_KEY) } catch {}
}
