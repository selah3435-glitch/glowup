/** Rank inbound leads + overdue book guests on facts we have — no fake close %. */

import { listLeads, type Lead } from './leads-store'
import { getOverdueHighValueClient, type HighValueClient } from './book-gaps'

export type ScoutRow = {
  id: string
  name: string
  firstName: string
  phone: string
  email: string
  service: string
  source: string
  band: 'hot' | 'warm' | 'nurture'
  points: number
  reasons: string[]
  kind: 'lead' | 'book'
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full
}

function rankLead(lead: Lead): ScoutRow {
  const reasons: string[] = []
  let points = 0
  if (lead.fit === 'hot') {
    points += 5
    reasons.push('Marked hot in CRM')
  } else if (lead.fit === 'warm') {
    points += 3
    reasons.push('Marked warm in CRM')
  } else if (lead.fit === 'nurture') {
    points += 1
    reasons.push('Marked nurture')
  }
  if (lead.status === 'qualified') {
    points += 3
    reasons.push('Qualified')
  } else if (lead.status === 'new') {
    points += 2
    reasons.push('New, not worked')
  }
  if (lead.phone) {
    points += 2
    reasons.push('Phone on file')
  }
  if (lead.serviceInterest) {
    points += 1
    reasons.push(`Wants ${lead.serviceInterest}`)
  }
  const days = Math.max(
    0,
    Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 86400000),
  )
  if (days <= 2) {
    points += 2
    reasons.push('Created in the last 2 days')
  }
  let band: ScoutRow['band'] = 'nurture'
  if (points >= 8) band = 'hot'
  else if (points >= 4) band = 'warm'
  return {
    id: lead.id,
    name: lead.name,
    firstName: firstName(lead.name),
    phone: lead.phone,
    email: lead.email,
    service: lead.serviceInterest || lead.interest || 'a visit',
    source: lead.source,
    band,
    points,
    reasons,
    kind: 'lead',
  }
}

function rankBookGuest(g: HighValueClient): ScoutRow {
  const reasons = [
    `${g.visitCount} visit${g.visitCount === 1 ? '' : 's'} on the book`,
    `${g.daysSince} days quiet`,
    g.kind === 'rebook' ? 'Color return window' : 'Win-back window',
  ]
  let points = g.visitCount * 2
  if (g.kind === 'rebook') points += 3
  if (g.phone) points += 2
  if (g.daysSince >= 60) points += 1
  let band: ScoutRow['band'] = 'nurture'
  if (points >= 8) band = 'hot'
  else if (points >= 4) band = 'warm'
  return {
    id: g.id,
    name: g.name,
    firstName: g.firstName,
    phone: g.phone,
    email: g.email,
    service: g.lastServiceType,
    source: 'book',
    band,
    points,
    reasons,
    kind: 'book',
  }
}

export function listScoutRows(): ScoutRow[] {
  const fromCrm = listLeads()
    .filter((l) => l.status !== 'lost' && l.status !== 'booked')
    .map(rankLead)
  const overdue = getOverdueHighValueClient('local', 60)
  const fromBook = overdue ? [rankBookGuest(overdue)] : []
  return [...fromCrm, ...fromBook].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
}

export function formatLeadScoutExtra(row: ScoutRow, bookingUrl?: string): string {
  return [
    'LEAD (do not invent another person):',
    `${row.firstName} · ${row.service} · ${row.kind} · ${row.band} (${row.points} fact-points)`,
    ...row.reasons.map((r) => `- ${r}`),
    row.phone ? 'Phone on file.' : 'No phone.',
    bookingUrl ? `Booking URL: ${bookingUrl}` : 'No booking URL. Do not invent one.',
  ].join('\n')
}
