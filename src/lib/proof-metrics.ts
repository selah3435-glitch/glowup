/** Real proof metrics from this device's live book / CRM / payments */

import { listAppointments } from './calendar-store'
import { listLeads } from './leads-store'

export type ProofMetrics = {
  afterHoursAiBooks: number
  totalAiBooks: number
  depositRequested: number
  depositPaid: number
  depositRate: number
  confirmedAppointments: number
  leadsCaptured: number
  leadsBooked: number
  multiStylistDays: number
  returningPct: number | null
  returningGuestCount: number
  guestCount: number
  asOf: string
}

function isAfterHours(time: string): boolean {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return false
  let h = Number(m[1])
  const ap = m[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h >= 18 || h < 9
}

export function guestKey(phone: string | undefined, name: string | undefined): string {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  if (digits.length >= 7) return digits
  return String(name || '').trim().toLowerCase()
}

export function returningPctFromVisits(
  visits: { clientPhone?: string; clientName?: string; status?: string }[],
): number | null {
  const counts = new Map<string, number>()
  for (const v of visits) {
    if (v.status !== 'confirmed' && v.status !== 'completed') continue
    const key = guestKey(v.clientPhone, v.clientName)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  if (counts.size < 2) return null
  let repeats = 0
  for (const n of counts.values()) if (n >= 2) repeats += 1
  return Math.round((repeats / counts.size) * 100)
}

/** Compute proof stats from local production data (not fake marketing numbers). */
export function computeProofMetrics(): ProofMetrics {
  const appts = listAppointments(true)
  const confirmed = appts.filter((a) => a.status === 'confirmed' || a.status === 'completed')
  const returningPct = returningPctFromVisits(confirmed)
  const counts = new Map<string, number>()
  for (const a of confirmed) {
    const k = guestKey(a.clientPhone, a.clientName)
    if (!k) continue
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  const guestCount = counts.size
  let returningGuestCount = 0
  for (const n of counts.values()) if (n >= 2) returningGuestCount += 1
  const aiBooks = confirmed.filter((a) => a.source === 'ai_receptionist')
  const afterHoursAiBooks = aiBooks.filter((a) => isAfterHours(a.time)).length
  const depositRequested = confirmed.filter(
    (a) => a.paymentStatus === 'deposit_requested' || a.paymentStatus === 'paid' || a.paymentStatus === 'waived',
  ).length
  const depositPaid = confirmed.filter((a) => a.paymentStatus === 'paid').length
  const depositDenom = depositRequested || confirmed.length || 1
  const depositRate = Math.round((depositPaid / depositDenom) * 100)

  const byDay = new Map<string, Set<string>>()
  for (const a of confirmed) {
    if (!byDay.has(a.dateISO)) byDay.set(a.dateISO, new Set())
    byDay.get(a.dateISO)!.add((a.stylist || 'Studio').toLowerCase())
  }
  let multiStylistDays = 0
  for (const set of byDay.values()) {
    if (set.size >= 2) multiStylistDays++
  }

  const leads = listLeads()
  const leadsBooked = leads.filter((l) => l.status === 'booked').length

  return {
    afterHoursAiBooks,
    totalAiBooks: aiBooks.length,
    depositRequested,
    depositPaid,
    depositRate: Number.isFinite(depositRate) ? depositRate : 0,
    confirmedAppointments: confirmed.length,
    leadsCaptured: leads.length,
    leadsBooked,
    multiStylistDays,
    returningPct,
    returningGuestCount,
    guestCount,
    asOf: new Date().toISOString(),
  }
}
