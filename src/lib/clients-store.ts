/** Client CRM MVP — local system of record; links to calendar appointments */

import { listAppointments, type Appointment } from './calendar-store'

export type Client = {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  phone: string
  email: string
  notes: string
  formulas: string
  preferences: string
  source: 'manual' | 'from_booking' | 'ai_receptionist'
}

const KEY = 'glowup_clients_v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll(): Client[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Client[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list: Client[]) {
  if (!canUseStorage()) throw new Error('localStorage unavailable')
  window.localStorage.setItem(KEY, JSON.stringify(list))
  void import('./ops-auto-sync')
    .then((m) => m.scheduleCloudPush('clients'))
    .catch(() => undefined)
}

export function listClients(): Client[] {
  return readAll().sort((a, b) => a.name.localeCompare(b.name))
}

export function digitsOnly(s: string) {
  return s.replace(/\D/g, '')
}

export function findClientByPhone(phone: string): Client | undefined {
  const d = digitsOnly(phone)
  if (d.length < 7) return undefined
  return readAll().find((c) => digitsOnly(c.phone).endsWith(d.slice(-7)) || d.endsWith(digitsOnly(c.phone).slice(-7)))
}

export function upsertClientFromBooking(input: {
  name: string
  phone: string
  source?: Client['source']
  notes?: string
}): Client {
  const existing = findClientByPhone(input.phone)
  const now = new Date().toISOString()
  if (existing) {
    const next: Client = {
      ...existing,
      name: input.name.trim() || existing.name,
      phone: input.phone.trim() || existing.phone,
      updatedAt: now,
      notes: input.notes ? `${existing.notes}\n${input.notes}`.trim() : existing.notes,
    }
    const all = readAll().map((c) => (c.id === existing.id ? next : c))
    writeAll(all)
    return next
  }
  const client: Client = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: '',
    notes: input.notes || '',
    formulas: '',
    preferences: '',
    source: input.source || 'from_booking',
  }
  const all = readAll()
  all.push(client)
  writeAll(all)
  return client
}

export function addClient(input: {
  name: string
  phone: string
  email?: string
  notes?: string
  formulas?: string
  preferences?: string
}): Client {
  const now = new Date().toISOString()
  const client: Client = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: (input.email || '').trim(),
    notes: (input.notes || '').trim(),
    formulas: (input.formulas || '').trim(),
    preferences: (input.preferences || '').trim(),
    source: 'manual',
  }
  const all = readAll()
  all.push(client)
  writeAll(all)
  return client
}

export function updateClient(id: string, patch: Partial<Client>): Client | null {
  const all = readAll()
  const idx = all.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const next = { ...all[idx], ...patch, id, updatedAt: new Date().toISOString() }
  all[idx] = next
  writeAll(all)
  return next
}

export function deleteClient(id: string): boolean {
  const prev = readAll()
  const all = prev.filter((c) => c.id !== id)
  if (all.length === prev.length) return false
  writeAll(all)
  return true
}

/** Sync clients from existing appointments (phone/name) */
export function syncClientsFromAppointments(): number {
  const appts = listAppointments(true)
  let n = 0
  for (const a of appts) {
    if (!a.clientPhone || !a.clientName) continue
    const before = findClientByPhone(a.clientPhone)
    upsertClientFromBooking({
      name: a.clientName,
      phone: a.clientPhone,
      source: a.source === 'ai_receptionist' ? 'ai_receptionist' : 'from_booking',
    })
    if (!before) n++
  }
  return n
}

export function appointmentsForClient(client: Client): Appointment[] {
  const d = digitsOnly(client.phone)
  return listAppointments(true).filter((a) => {
    const pd = digitsOnly(a.clientPhone)
    return (
      pd &&
      d &&
      (pd === d || pd.endsWith(d.slice(-7)) || d.endsWith(pd.slice(-7)))
    )
  })
}

export function clientVisitStats(client: Client) {
  const appts = appointmentsForClient(client).filter((a) => a.status !== 'cancelled')
  const upcoming = appts.filter((a) => a.dateISO >= new Date().toISOString().slice(0, 10))
  const past = appts.filter((a) => a.dateISO < new Date().toISOString().slice(0, 10))
  return {
    total: appts.length,
    upcoming: upcoming.length,
    lastService: past[past.length - 1]?.service || '—',
    lastVisit: past[past.length - 1]?.dateLabel || '—',
  }
}
