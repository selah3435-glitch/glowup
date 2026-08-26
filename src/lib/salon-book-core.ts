/**
 * Pure salon book — no window/localStorage.
 * Shared by Glo desk API and compatible with calendar-store appointments.
 */

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type PaymentStatus = 'unpaid' | 'deposit_requested' | 'paid' | 'waived'

export type Appointment = {
  id: string
  createdAt: string
  updatedAt: string
  status: AppointmentStatus
  paymentStatus: PaymentStatus
  depositAmount?: string
  service: string
  durationMin: number
  dateISO: string
  dateLabel: string
  time: string
  startMinutes: number
  clientName: string
  clientPhone: string
  clientEmail?: string
  stylist: string
  notes?: string
  source: 'ai_receptionist' | 'owner' | 'migrated_hold'
}

/** @deprecated Use Appointment — same calendar-store JSON shape. */
export type CoreAppointment = Appointment

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

/** @deprecated Use Client — same clients-store JSON shape. */
export type CoreClient = Client

export type DayOption = { dateISO: string; dateLabel: string; weekday: string }

export const DEFAULT_SERVICES = [
  'Cut & style',
  'Balayage',
  'Gloss + blowout',
  'Color services',
  'Signature facial',
  'Haircuts & styling',
]

export const DEFAULT_HOURS = 'Monday–Saturday 9:00 AM–4:00 PM'

export const SLOT_TIMES = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
] as const

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00`)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function parseTimeToMinutes(time: string): number {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return 0
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = m[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + min
}

export function durationForService(service: string): number {
  const s = service.toLowerCase()
  if (s.includes('balayage') || s.includes('dimensional')) return 150
  if (s.includes('color') || s.includes('colour')) return 120
  if (s.includes('gloss')) return 60
  if (s.includes('facial') || s.includes('skin')) return 60
  if (s.includes('cut') || s.includes('style') || s.includes('haircut')) return 60
  if (s.includes('nail')) return 45
  return 60
}

export function shortHoldCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export function phoneTail(phone: string): string {
  return phone.replace(/\D/g, '').slice(-7)
}

export function getBusinessDays(count: number, from = new Date()): DayOption[] {
  const out: DayOption[] = []
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  while (out.length < count) {
    if (d.getDay() !== 0) {
      const dateISO = toISODate(d)
      out.push({
        dateISO,
        dateLabel: formatDateLabel(dateISO),
        weekday: WEEKDAYS[d.getDay()],
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return out
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

export function asAppointments(raw: unknown): Appointment[] {
  return Array.isArray(raw) ? (raw as Appointment[]) : []
}

export function asClients(raw: unknown): Client[] {
  return Array.isArray(raw) ? (raw as Client[]) : []
}

/** Union by id. Later updatedAt/createdAt wins. Keeps cloud-only Glo rows. */
export function mergeById(a: unknown, b: unknown): unknown[] {
  type Row = { id?: string; updatedAt?: string; createdAt?: string }
  const left = Array.isArray(a) ? (a as Row[]) : []
  const right = Array.isArray(b) ? (b as Row[]) : []
  const map = new Map<string, Row>()
  for (const item of [...left, ...right]) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) continue
    const prev = map.get(item.id)
    const nextTs = Date.parse(item.updatedAt || item.createdAt || '') || 0
    const prevTs = prev ? Date.parse(prev.updatedAt || prev.createdAt || '') || 0 : -1
    if (!prev || nextTs >= prevTs) map.set(item.id, item)
  }
  return Array.from(map.values())
}

export function hasConflict(
  appts: Appointment[],
  dateISO: string,
  time: string,
  durationMin: number,
  exceptId?: string,
  stylist?: string,
): boolean {
  const start = parseTimeToMinutes(time)
  const end = start + durationMin
  const stylistKey = (stylist || 'Studio').trim().toLowerCase()
  return appts.some((a) => {
    if (exceptId && a.id === exceptId) return false
    if (a.status === 'cancelled') return false
    if (a.dateISO !== dateISO) return false
    if ((a.stylist || 'Studio').trim().toLowerCase() !== stylistKey) return false
    const aEnd = (a.startMinutes || parseTimeToMinutes(a.time)) + (a.durationMin || 60)
    return rangesOverlap(start, end, a.startMinutes || parseTimeToMinutes(a.time), aEnd)
  })
}

export function getOpenSlots(
  appts: Appointment[],
  dateISO: string,
  service = 'Service',
  exceptId?: string,
  stylist?: string,
): string[] {
  const durationMin = durationForService(service)
  return SLOT_TIMES.filter((t) => !hasConflict(appts, dateISO, t, durationMin, exceptId, stylist))
}

export type BookInput = {
  service: string
  dateISO: string
  time: string
  clientName: string
  clientPhone: string
  stylist?: string
  notes?: string
  source?: Appointment['source']
}

export function buildAppointment(input: BookInput): Appointment {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const durationMin = durationForService(input.service)
  return {
    id,
    createdAt: now,
    updatedAt: now,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    service: input.service.trim(),
    durationMin,
    dateISO: input.dateISO,
    dateLabel: formatDateLabel(input.dateISO),
    time: input.time,
    startMinutes: parseTimeToMinutes(input.time),
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    stylist: (input.stylist || 'Studio').trim() || 'Studio',
    notes: input.notes,
    source: input.source || 'ai_receptionist',
  }
}

export function applyBook(
  appts: Appointment[],
  input: BookInput,
): { ok: true; appointment: Appointment } | { ok: false; error: string } {
  if (!input.clientName?.trim() || !input.clientPhone?.trim()) {
    return { ok: false, error: 'Name and phone are required.' }
  }
  if (!input.dateISO || !input.time || !input.service?.trim()) {
    return { ok: false, error: 'Service, day, and time are required.' }
  }
  const durationMin = durationForService(input.service)
  const stylist = (input.stylist || 'Studio').trim()
  if (hasConflict(appts, input.dateISO, input.time, durationMin, undefined, stylist)) {
    return { ok: false, error: 'That chair is full at that time — pick another opening.' }
  }
  return { ok: true, appointment: buildAppointment({ ...input, stylist }) }
}

function latestConfirmedByPhone(appts: Appointment[], phone: string): Appointment | undefined {
  const tail = phoneTail(phone)
  if (tail.length < 7) return undefined
  return appts
    .filter((a) => a.status === 'confirmed' && phoneTail(a.clientPhone) === tail)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.dateISO.localeCompare(a.dateISO))[0]
}

export function applyReschedule(
  appts: Appointment[],
  input: { clientPhone: string; dateISO: string; time: string },
): { ok: true; appointment: Appointment; appointments: Appointment[] } | { ok: false; error: string } {
  const cur = latestConfirmedByPhone(appts, input.clientPhone)
  if (!cur) return { ok: false, error: 'No confirmed booking on this phone.' }
  if (hasConflict(appts, input.dateISO, input.time, cur.durationMin, cur.id, cur.stylist)) {
    return { ok: false, error: 'That slot conflicts with another booking on this chair.' }
  }
  const next: Appointment = {
    ...cur,
    dateISO: input.dateISO,
    dateLabel: formatDateLabel(input.dateISO),
    time: input.time,
    startMinutes: parseTimeToMinutes(input.time),
    updatedAt: new Date().toISOString(),
    status: 'confirmed',
  }
  return { ok: true, appointment: next, appointments: appts.map((a) => (a.id === cur.id ? next : a)) }
}

export function applyCancel(
  appts: Appointment[],
  input: { clientPhone: string },
): { ok: true; appointment: Appointment; appointments: Appointment[] } | { ok: false; error: string } {
  const cur = latestConfirmedByPhone(appts, input.clientPhone)
  if (!cur) return { ok: false, error: 'No confirmed booking on this phone.' }
  const next: Appointment = { ...cur, status: 'cancelled', updatedAt: new Date().toISOString() }
  return { ok: true, appointment: next, appointments: appts.map((a) => (a.id === cur.id ? next : a)) }
}

export function upsertClient(
  clients: Client[],
  input: { name: string; phone: string; source?: Client['source'] },
): Client[] {
  const tail = phoneTail(input.phone)
  const now = new Date().toISOString()
  const idx = tail.length >= 7 ? clients.findIndex((c) => phoneTail(c.phone) === tail) : -1
  if (idx >= 0) {
    const next = [...clients]
    next[idx] = {
      ...next[idx],
      name: input.name.trim() || next[idx].name,
      phone: input.phone.trim() || next[idx].phone,
      updatedAt: now,
    }
    return next
  }
  return [
    ...clients,
    {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: '',
      notes: '',
      formulas: '',
      preferences: '',
      source: input.source || 'ai_receptionist',
    },
  ]
}

export type DeskDay = DayOption & { slots: string[] }

export function publicDeskView(snap: {
  settings?: Record<string, unknown>
  appointments?: unknown
}): {
  studioName: string
  city: string
  hours: string
  services: string[]
  days: DeskDay[]
} {
  const s = snap.settings || {}
  const studioName = String(s.studioName || 'Studio').trim() || 'Studio'
  const city = typeof s.city === 'string' ? s.city.trim() : ''
  const hours = typeof s.hours === 'string' && s.hours.trim() ? s.hours.trim() : DEFAULT_HOURS
  const services = Array.isArray(s.services)
    ? (s.services as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : []
  const menu = services.length ? services : [...DEFAULT_SERVICES]
  const appts = asAppointments(snap.appointments)
  const days = getBusinessDays(7).map((day) => ({
    ...day,
    slots: getOpenSlots(appts, day.dateISO, menu[0] || 'Service'),
  }))
  return { studioName, city, hours, services: menu, days }
}
