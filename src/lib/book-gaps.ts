/** Live book signals for Fill the Book — no invented occupancy. */

import { DEMO_STYLISTS } from './demo-salon'
import {
  SLOT_TIMES,
  formatDateLabel,
  listAppointments,
  listForDay,
  toISODate,
  type Appointment,
} from './calendar-store'
import { appointmentsForClient, findClientByPhone } from './clients-store'
import type { CopyCampaign } from '../agents/copywriter'

const COLOR_RE = /balayage|color|colour|gloss/i

export type OpenChair = {
  dateISO: string
  dateLabel: string
  time: string
  stylist: string
}

export type DueGuest = {
  firstName: string
  lastService: string
  lastDateISO: string
  weeksSince: number
  kind: 'rebook' | 'winback'
}

/** Overdue guest ranked from the live book — visit count only, no invented spend. */
export type HighValueClient = {
  id: string
  name: string
  firstName: string
  phone: string
  email: string
  lastServiceType: string
  lastDateISO: string
  daysSince: number
  weeksSince: number
  visitCount: number
  kind: 'rebook' | 'winback'
}

export type BookGapSnapshot = {
  tomorrowISO: string
  tomorrowLabel: string
  openChairs: OpenChair[]
  bookedTomorrow: number
  rebookDue: DueGuest[]
  winbackDue: DueGuest[]
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full
}

function weeksBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + 'T12:00:00').getTime()
  const b = new Date(toISO + 'T12:00:00').getTime()
  return Math.max(0, Math.round((b - a) / (7 * 24 * 60 * 60 * 1000)))
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + 'T12:00:00').getTime()
  const b = new Date(toISO + 'T12:00:00').getTime()
  return Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)))
}

function lastVisitByGuest(appts: Appointment[]): Map<string, Appointment> {
  const map = new Map<string, Appointment>()
  const done = appts.filter((a) => a.status === 'completed' || a.status === 'confirmed')
  for (const a of done) {
    const key = a.clientPhone || a.clientName
    const prev = map.get(key)
    if (!prev || a.dateISO > prev.dateISO) map.set(key, a)
  }
  return map
}

/** Open chairs for a date. salonId is reserved for multi-tenant ops; the live book is local. */
export function getEmptySlotsForDate(_salonId: string, date: Date): OpenChair[] {
  const dateISO = toISODate(date)
  const booked = listForDay(dateISO).filter((a) => a.status === 'confirmed')
  const onboarded =
    typeof window !== 'undefined' && window.localStorage.getItem('glowup_onboarded_v1') === '1'
  const fromBook = booked.map((a) => a.stylist).filter(Boolean)
  const stylists = Array.from(
    new Set(
      onboarded
        ? fromBook.length
          ? fromBook
          : ['Studio']
        : [...DEMO_STYLISTS.filter((s) => s !== 'Front desk'), ...fromBook],
    ),
  )
  const taken = new Set(booked.map((a) => `${a.stylist}|${a.time}`))
  const openChairs: OpenChair[] = []
  for (const stylist of stylists) {
    for (const time of SLOT_TIMES) {
      if (!taken.has(`${stylist}|${time}`)) {
        openChairs.push({
          dateISO,
          dateLabel: formatDateLabel(dateISO),
          time,
          stylist,
        })
      }
    }
  }
  return openChairs
}

function guestKind(visit: Appointment, weeks: number): 'rebook' | 'winback' {
  if (weeks >= 16) return 'winback'
  if (COLOR_RE.test(visit.service) && weeks >= 8) return 'rebook'
  return 'rebook'
}

/**
 * Most-visited guest who has been quiet at least `minQuietDays` and is not already
 * on tomorrow's book. Rank is visit count from the real book — not invented tickets.
 */
export function getOverdueHighValueClient(_salonId: string, minQuietDays = 60): HighValueClient | null {
  const today = toISODate(new Date())
  const t = new Date()
  t.setDate(t.getDate() + 1)
  const tomorrowISO = toISODate(t)
  const bookedTomorrow = new Set(
    listForDay(tomorrowISO)
      .filter((a) => a.status === 'confirmed')
      .map((a) => a.clientPhone || a.clientName),
  )

  const candidates: HighValueClient[] = []
  for (const visit of lastVisitByGuest(listAppointments(true)).values()) {
    const days = daysBetween(visit.dateISO, today)
    if (days < minQuietDays) continue
    const key = visit.clientPhone || visit.clientName
    if (bookedTomorrow.has(key)) continue

    const crm = visit.clientPhone ? findClientByPhone(visit.clientPhone) : undefined
    const history = crm
      ? appointmentsForClient(crm)
      : listAppointments(true).filter((a) => (a.clientPhone || a.clientName) === key)
    const visitCount = history.filter((a) => a.status === 'completed' || a.status === 'confirmed').length
    const weeks = weeksBetween(visit.dateISO, today)

    candidates.push({
      id: crm?.id || visit.clientPhone || visit.clientName,
      name: visit.clientName,
      firstName: firstName(visit.clientName),
      phone: visit.clientPhone || crm?.phone || '',
      email: visit.clientEmail || crm?.email || '',
      lastServiceType: visit.service,
      lastDateISO: visit.dateISO,
      daysSince: days,
      weeksSince: weeks,
      visitCount,
      kind: guestKind(visit, weeks),
    })
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.visitCount - a.visitCount || b.daysSince - a.daysSince)
  return candidates[0]
}

export function snapshotBookGaps(): BookGapSnapshot {
  const today = toISODate(new Date())
  const t = new Date()
  t.setDate(t.getDate() + 1)
  const tomorrowISO = toISODate(t)
  const booked = listForDay(tomorrowISO).filter((a) => a.status === 'confirmed')
  const openChairs = getEmptySlotsForDate('local', t)

  const last = lastVisitByGuest(listAppointments(true))
  const rebookDue: DueGuest[] = []
  const winbackDue: DueGuest[] = []
  for (const visit of last.values()) {
    const weeks = weeksBetween(visit.dateISO, today)
    const color = COLOR_RE.test(visit.service)
    if (color && weeks >= 8 && weeks <= 14) {
      rebookDue.push({
        firstName: firstName(visit.clientName),
        lastService: visit.service,
        lastDateISO: visit.dateISO,
        weeksSince: weeks,
        kind: 'rebook',
      })
    } else if (weeks >= 16) {
      winbackDue.push({
        firstName: firstName(visit.clientName),
        lastService: visit.service,
        lastDateISO: visit.dateISO,
        weeksSince: weeks,
        kind: 'winback',
      })
    }
  }

  return {
    tomorrowISO,
    tomorrowLabel: formatDateLabel(tomorrowISO),
    openChairs,
    bookedTomorrow: booked.length,
    rebookDue,
    winbackDue,
  }
}

export function formatBookGapExtra(campaign: CopyCampaign, snap: BookGapSnapshot): string {
  const lines: string[] = ['LIVE BOOK (do not invent rows beyond this):']
  if (campaign === 'slow') {
    lines.push(
      `${snap.bookedTomorrow} booked tomorrow (${snap.tomorrowLabel}). ${snap.openChairs.length} open chairs.`,
    )
    const sample = snap.openChairs.slice(0, 8)
    if (sample.length) {
      lines.push('Open chairs: ' + sample.map((c) => `${c.stylist} ${c.time}`).join(', '))
    } else {
      lines.push('No open chairs tomorrow.')
    }
  }
  if (campaign === 'rebook') {
    if (!snap.rebookDue.length) lines.push('No guests in the 8–14 week color return window.')
    else {
      lines.push(`${snap.rebookDue.length} color returns due:`)
      for (const g of snap.rebookDue.slice(0, 6)) {
        lines.push(`- ${g.firstName}: ${g.lastService}, ${g.weeksSince} weeks ago (${g.lastDateISO})`)
      }
    }
  }
  if (campaign === 'winback') {
    if (!snap.winbackDue.length) lines.push('No guests quiet 16+ weeks.')
    else {
      lines.push(`${snap.winbackDue.length} win-backs:`)
      for (const g of snap.winbackDue.slice(0, 6)) {
        lines.push(`- ${g.firstName}: last ${g.lastService}, ${g.weeksSince} weeks quiet`)
      }
    }
  }
  return lines.join('\n')
}
