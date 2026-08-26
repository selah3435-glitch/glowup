/** Post-visit rows for Reputation — yesterday + today's completed. No invented visits. */

import { listForDay, toISODate, type Appointment } from './calendar-store'

export type ReviewVisit = {
  id: string
  firstName: string
  name: string
  phone: string
  email: string
  service: string
  stylist: string
  time: string
  dateISO: string
  when: 'yesterday' | 'today'
  status: Appointment['status']
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full
}

export function yesterdayISO(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - 1)
  return toISODate(d)
}

export function listReviewVisits(now = new Date()): ReviewVisit[] {
  const today = toISODate(now)
  const yesterday = yesterdayISO(now)
  const rows: ReviewVisit[] = []

  for (const a of listForDay(yesterday)) {
    if (a.status === 'cancelled' || a.status === 'no_show') continue
    rows.push(toVisit(a, 'yesterday'))
  }
  for (const a of listForDay(today)) {
    if (a.status === 'cancelled' || a.status === 'no_show') continue
    rows.push(toVisit(a, 'today'))
  }
  return rows
}

function toVisit(a: Appointment, when: ReviewVisit['when']): ReviewVisit {
  return {
    id: a.id,
    firstName: firstName(a.clientName),
    name: a.clientName,
    phone: a.clientPhone || '',
    email: a.clientEmail || '',
    service: a.service,
    stylist: a.stylist,
    time: a.time,
    dateISO: a.dateISO,
    when,
    status: a.status,
  }
}

export function formatReputationExtra(
  visits: ReviewVisit[],
  reviewUrl?: string,
): string {
  const lines = ['POST-VISIT ROWS (do not invent beyond this):']
  if (!visits.length) {
    lines.push('No yesterday visits and no completed visits today.')
    return lines.join('\n')
  }
  for (const v of visits.slice(0, 8)) {
    lines.push(
      `- ${v.firstName}: ${v.service} with ${v.stylist} (${v.when} ${v.time}). Phone ${v.phone ? 'on file' : 'missing'}.`,
    )
  }
  if (reviewUrl?.trim()) lines.push(`Google review URL: ${reviewUrl.trim()}`)
  else lines.push('No Google review URL on file. Do not invent one.')
  return lines.join('\n')
}
