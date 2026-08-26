/** Glo AI website lead capture — Phase 2 differentiator */

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'booked' | 'lost'
export type LeadSource = 'website_chat' | 'voice' | 'manual' | 'import'

export type Lead = {
  id: string
  createdAt: string
  updatedAt: string
  status: LeadStatus
  source: LeadSource
  name: string
  phone: string
  email: string
  interest: string
  serviceInterest: string
  notes: string
  fit: 'hot' | 'warm' | 'nurture' | 'unknown'
  assignedGloRole: 'glo_sales' | 'glo_scheduler' | 'glo_support' | 'glo_reception'
}

const KEY = 'glowup_leads_v1'

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll(): Lead[] {
  if (!canUse()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const p = JSON.parse(raw) as Lead[]
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

function writeAll(list: Lead[]) {
  if (!canUse()) throw new Error('localStorage unavailable')
  window.localStorage.setItem(KEY, JSON.stringify(list))
}

export function listLeads(): Lead[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listNewLeads(limit = 50): Lead[] {
  return listLeads()
    .filter((l) => l.status === 'new' || l.status === 'qualified')
    .slice(0, limit)
}

export function captureLead(input: {
  name: string
  phone: string
  email?: string
  interest?: string
  serviceInterest?: string
  notes?: string
  fit?: Lead['fit']
  source?: LeadSource
  assignedGloRole?: Lead['assignedGloRole']
}): Lead {
  const now = new Date().toISOString()
  const digits = input.phone.replace(/\D/g, '')
  const existing = readAll().find((l) => l.phone.replace(/\D/g, '').slice(-7) === digits.slice(-7))
  if (existing) {
    const next: Lead = {
      ...existing,
      name: input.name.trim() || existing.name,
      phone: input.phone.trim() || existing.phone,
      email: (input.email || existing.email).trim(),
      interest: input.interest || existing.interest,
      serviceInterest: input.serviceInterest || existing.serviceInterest,
      notes: [existing.notes, input.notes].filter(Boolean).join('\n'),
      fit: input.fit || existing.fit,
      status: existing.status === 'lost' ? 'new' : existing.status,
      updatedAt: now,
      source: input.source || existing.source,
    }
    writeAll(readAll().map((l) => (l.id === existing.id ? next : l)))
    // mirror into CRM lightly
    void import('./clients-store').then((m) => {
      m.upsertClientFromBooking({
        name: next.name,
        phone: next.phone,
        source: 'ai_receptionist',
        notes: `Lead: ${next.serviceInterest || next.interest}`,
      })
    })
    return next
  }

  const lead: Lead = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'new',
    source: input.source || 'website_chat',
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: (input.email || '').trim(),
    interest: (input.interest || '').trim(),
    serviceInterest: (input.serviceInterest || '').trim(),
    notes: (input.notes || '').trim(),
    fit: input.fit || 'warm',
    assignedGloRole: input.assignedGloRole || 'glo_sales',
  }
  const all = readAll()
  all.push(lead)
  writeAll(all)
  void import('./clients-store').then((m) => {
    m.upsertClientFromBooking({
      name: lead.name,
      phone: lead.phone,
      source: 'ai_receptionist',
      notes: `Lead capture: ${lead.serviceInterest || lead.interest}`,
    })
  })
  void import('./notifications-store').then((n) => {
    void import('./ops-settings').then((ops) => {
      const s = ops.loadOpsSettings()
      if (s.ownerNotifyPhone || s.ownerNotifyEmail) {
        n.queueMessage({
          channel: s.ownerNotifyPhone ? 'sms' : 'email',
          to: s.ownerNotifyPhone || s.ownerNotifyEmail,
          subject: `New lead · ${lead.name}`,
          body: `Glo captured a lead:\n${lead.name}\n${lead.phone}\n${lead.serviceInterest || lead.interest}\nSource: website chat`,
          kind: 'custom',
        })
      }
    })
  })
  return lead
}

export function updateLeadStatus(id: string, status: LeadStatus): boolean {
  const all = readAll()
  const idx = all.findIndex((l) => l.id === id)
  if (idx < 0) return false
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() }
  writeAll(all)
  return true
}

export function leadCounts() {
  const all = listLeads()
  return {
    total: all.length,
    new: all.filter((l) => l.status === 'new').length,
    qualified: all.filter((l) => l.status === 'qualified').length,
    booked: all.filter((l) => l.status === 'booked').length,
  }
}
