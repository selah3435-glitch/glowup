/**
 * GlowUP company sales prospects — salons to sell the OS to.
 * Separate from tenant CRM guests. No invented close rates.
 */

import { COMPANY_ICP_LINE, icpBand, scoreCompanyIcp } from './company-icp'
import type { PlatformSignup } from './platform-client'

export type CompanyLeadSource = 'signup' | 'gap_audit' | 'manual' | 'import'

export type CompanyLead = {
  id: string
  createdAt: string
  salonName: string
  ownerName: string
  email: string
  phone: string
  city: string
  website: string
  chairs: string
  notes: string
  source: CompanyLeadSource
  stage: string
}

export type CompanyScoutRow = CompanyLead & {
  band: 'hot' | 'warm' | 'nurture'
  points: number
  reasons: string[]
}

const KEY = 'glowup_company_leads_v1'
const AUDIT_KEY = 'glowup_gap_audit_v1'

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readManual(): CompanyLead[] {
  if (!canUse()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const p = JSON.parse(raw) as CompanyLead[]
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

function writeManual(list: CompanyLead[]) {
  if (!canUse()) return
  window.localStorage.setItem(KEY, JSON.stringify(list))
}

export function listManualCompanyLeads(): CompanyLead[] {
  return readManual()
}

export function addCompanyLead(input: Omit<CompanyLead, 'id' | 'createdAt' | 'source' | 'stage'> & {
  source?: CompanyLeadSource
  stage?: string
}): CompanyLead {
  const lead: CompanyLead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    salonName: input.salonName.trim(),
    ownerName: input.ownerName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    website: input.website.trim(),
    chairs: input.chairs.trim(),
    notes: input.notes.trim(),
    source: input.source || 'manual',
    stage: input.stage || 'prospect',
  }
  const all = readManual()
  const key = (lead.website || lead.email || `${lead.salonName}|${lead.phone}` || lead.id).toLowerCase()
  const exists = all.some(
    (r) => (r.website || r.email || `${r.salonName}|${r.phone}` || r.id).toLowerCase() === key,
  )
  if (exists) return lead
  all.push(lead)
  writeManual(all)
  return lead
}

function fromSignup(s: PlatformSignup): CompanyLead {
  const meta = (s.meta || {}) as Record<string, unknown>
  return {
    id: `plat_${s.id}`,
    createdAt: s.createdAt,
    salonName: String(meta.salonName || s.name || ''),
    ownerName: s.name || '',
    email: s.email,
    phone: String(meta.phone || ''),
    city: String(meta.city || ''),
    website: String(meta.website || ''),
    chairs: String(meta.chairs || meta.teamSize || ''),
    notes: meta.source === 'gap_audit' ? `Gap audit · missed/week ${meta.missedWeekly || '?'}` : '',
    source: meta.source === 'gap_audit' ? 'gap_audit' : 'signup',
    stage: s.stage,
  }
}

function fromGapAuditLocal(): CompanyLead[] {
  if (!canUse()) return []
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY)
    if (!raw) return []
    const a = JSON.parse(raw) as { email?: string; chairs?: string; missed?: string; at?: string }
    if (!a.email) return []
    return [
      {
        id: 'audit_local',
        createdAt: a.at || new Date().toISOString(),
        salonName: '',
        ownerName: '',
        email: a.email,
        phone: '',
        city: '',
        website: '',
        chairs: a.chairs || '',
        notes: a.missed ? `Said they miss ~${a.missed} bookings/week` : 'Gap audit form',
        source: 'gap_audit',
        stage: 'signed_up',
      },
    ]
  } catch {
    return []
  }
}

export function rankCompanyLead(lead: CompanyLead): CompanyScoutRow {
  const reasons: string[] = []
  let points = 0

  if (lead.stage === 'onboarding_started') {
    points += 5
    reasons.push('Started onboarding — not finished')
  } else if (lead.stage === 'signed_up') {
    points += 3
    reasons.push('Signed up / on the list')
  } else if (lead.stage === 'onboarding_complete' || lead.stage === 'active') {
    points += 1
    reasons.push('Already onboarded — expansion, not a new logo')
  } else {
    points += 2
    reasons.push('Manual prospect')
  }

  if (lead.source === 'gap_audit') {
    points += 3
    reasons.push('Asked for a gap audit')
  }
  if (lead.email) {
    points += 2
    reasons.push('Email on file')
  }
  if (lead.phone) {
    points += 1
    reasons.push('Phone on file')
  }

  const icp = scoreCompanyIcp({
    text: [lead.salonName, lead.ownerName, lead.notes, lead.website, lead.city].filter(Boolean).join(' '),
    chairs: lead.chairs,
  })
  points += icp.points
  reasons.push(...icp.signals)

  return { ...lead, band: icpBand(points), points, reasons }
}

export function listCompanyScoutRows(signups: PlatformSignup[] = []): CompanyScoutRow[] {
  const fromPlat = signups.map(fromSignup)
  const manual = readManual()
  const audit = fromGapAuditLocal().filter(
    (a) => !fromPlat.some((p) => p.email && p.email === a.email),
  )
  const seen = new Set<string>()
  const merged: CompanyLead[] = []
  for (const row of [...manual, ...fromPlat, ...audit]) {
    const key = (row.website || row.email || row.salonName || row.id).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(row)
  }
  return merged.map(rankCompanyLead).sort((a, b) => b.points - a.points)
}

export function exportCompanyAudienceCsv(rows: CompanyScoutRow[]): string {
  const header = 'email,phone,fn,ln,ct,country,salon,band,points,source'
  const lines = rows.map((r) => {
    const parts = r.ownerName.trim().split(/\s+/)
    const fn = parts[0] || r.salonName.split(/\s+/)[0] || ''
    const ln = parts.slice(1).join(' ')
    const cells = [
      r.email,
      r.phone,
      fn,
      ln,
      r.city,
      'US',
      r.salonName,
      r.band,
      String(r.points),
      r.source,
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`)
    return cells.join(',')
  })
  return [header, ...lines].join('\n')
}

export function exportCompanyLeadsBackupJson(rows: CompanyLead[] = readManual()): string {
  return JSON.stringify(
    {
      kind: 'glowup_company_leads_backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      storageKey: KEY,
      leads: rows,
    },
    null,
    2,
  )
}

export function importCompanyLeadsBackup(raw: string): { added: number; skipped: number; total: number } {
  const parsed = JSON.parse(raw) as { leads?: CompanyLead[] } | CompanyLead[]
  const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed.leads) ? parsed.leads : []
  if (!incoming.length) return { added: 0, skipped: 0, total: readManual().length }

  const existing = readManual()
  const seen = new Set(
    existing.map((r) => (r.website || r.email || r.salonName || r.id).toLowerCase()),
  )
  let added = 0
  let skipped = 0
  for (const row of incoming) {
    if (!row || typeof row !== 'object') {
      skipped += 1
      continue
    }
    const key = (row.website || row.email || row.salonName || row.id || '').toLowerCase()
    if (!key || seen.has(key)) {
      skipped += 1
      continue
    }
    seen.add(key)
    existing.push({
      id: row.id || crypto.randomUUID(),
      createdAt: row.createdAt || new Date().toISOString(),
      salonName: String(row.salonName || '').trim(),
      ownerName: String(row.ownerName || '').trim(),
      email: String(row.email || '').trim(),
      phone: String(row.phone || '').trim(),
      city: String(row.city || '').trim(),
      website: String(row.website || '').trim(),
      chairs: String(row.chairs || '').trim(),
      notes: String(row.notes || '').trim(),
      source: row.source || 'import',
      stage: row.stage || 'prospect',
    })
    added += 1
  }
  writeManual(existing)
  return { added, skipped, total: existing.length }
}

export function formatCompanyLeadExtra(row: CompanyScoutRow): string {
  return [
    'GLOWUP COMPANY SALE — Beauty salon SaaS at glowupbeautysolutions.com.',
    `ICP: ${COMPANY_ICP_LINE}`,
    `Salon: ${row.salonName || '(name missing)'}`,
    `Owner: ${row.ownerName || '(unknown)'}`,
    `City: ${row.city || '(unknown)'}`,
    `Email: ${row.email || 'none'}`,
    row.chairs ? `Chairs: ${row.chairs}` : '',
    row.website ? `Website: ${row.website}` : '',
    `Source: ${row.source} · stage: ${row.stage}`,
    `Band: ${row.band} · ${row.points} fact-points`,
    ...row.reasons.map((r) => `- ${r}`),
    row.notes ? `Notes: ${row.notes}` : '',
    'Do not invent occupancy, missed-booking counts, or a price they did not give.',
    'Offer: GlowUP OS + Glo — book, CRM, Fill the Book. Soft ask to start free setup /beta.',
    'CTA link if needed: https://glowupbeautysolutions.com/login?next=%2Fonboarding',
  ]
    .filter(Boolean)
    .join('\n')
}
