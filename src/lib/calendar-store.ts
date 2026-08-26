/**
 * Calendar spine — system of record for appointments.
 * AI Receptionist + owner dashboard share this store.
 * localStorage cache + multi-device push via /api/ops (Phase A).
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

export type DayOption = { dateISO: string; dateLabel: string; weekday: string }

export type BookingHold = {
  id: string
  createdAt: string
  status: 'held' | 'cancelled'
  service: string
  dateLabel: string
  dateISO: string
  time: string
  clientName: string
  clientPhone: string
  notes?: string
  source: 'ai_receptionist'
}

const APPT_KEY = 'glowup_appointments_v1'
const HOLDS_KEY = 'glowup_booking_holds_v1'
const MIGRATED_KEY = 'glowup_holds_migrated_v1'

export const DEFAULT_SERVICES = [
  'Cut & style',
  'Balayage',
  'Gloss + blowout',
  'Color services',
  'Signature facial',
  'Haircuts & styling',
]

/** Candidate start times (weekdays) */
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

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateLabel(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00')
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

export function formatDuration(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r ? `${h}h ${r}m` : `${h}h`
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

const DEMO_FLOOR_KEY = 'glowup_demo_floor_seeded_v1'
const REBOOK_HISTORY_KEY = 'glowup_rebook_history_v1'

/** Live tenant book — never seed Maya/Jordan onto a real floor or a signed-in device. */
function isLiveSalonBook() {
  if (!canUseStorage()) return false
  if (window.localStorage.getItem('glowup_onboarded_v1') === '1') return true
  try {
    const raw = window.localStorage.getItem('glowup_pilot_session_v1')
    if (raw) {
      const p = JSON.parse(raw) as { email?: string; onboardedAt?: string }
      if (p?.onboardedAt || p?.email) return true
    }
  } catch {
    /* ignore */
  }
  try {
    const raw = window.localStorage.getItem('glowup_ops_identity_v1')
    if (raw) {
      const p = JSON.parse(raw) as { email?: string }
      if (p?.email) return true
    }
  } catch {
    /* ignore */
  }
  try {
    const raw = window.localStorage.getItem('glowup_ops_settings_v1')
    if (raw) {
      const s = JSON.parse(raw) as { lastSyncedAt?: string }
      if (s?.lastSyncedAt) return true
    }
  } catch {
    /* ignore */
  }
  return false
}

function isDemoAppointmentId(id: string) {
  return /^(demo-floor-|demo-rebook-|demo-winback-)/.test(id)
}

/** Seed a multi-stylist floor when the book is empty (first visit only). */
function seedDemoFloorIfEmpty() {
  if (!canUseStorage()) return
  if (typeof window !== 'undefined' && window.location?.pathname === '/') return
  if (window.localStorage.getItem(DEMO_FLOOR_KEY) === '1') return
  // Real / signed-in salons start from their own book — never seed Maya/Jordan.
  if (isLiveSalonBook()) return
  try {
    const raw = window.localStorage.getItem(APPT_KEY)
    const existing = raw ? (JSON.parse(raw) as Appointment[]) : []
    if (Array.isArray(existing) && existing.length > 0) {
      window.localStorage.setItem(DEMO_FLOOR_KEY, '1')
      return
    }
  } catch {
    /* continue seed */
  }

  const today = toISODate(new Date())
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = toISODate(tomorrowDate)
  const now = new Date().toISOString()

  type Seed = {
    service: string
    dateISO: string
    time: string
    clientName: string
    clientPhone: string
    stylist: string
    source?: Appointment['source']
    paymentStatus?: PaymentStatus
  }

  const seeds: Seed[] = [
    {
      service: 'Balayage',
      dateISO: today,
      time: '9:00 AM',
      clientName: 'Maya Chen',
      clientPhone: '(310) 555-0142',
      stylist: 'Amelia',
      paymentStatus: 'deposit_requested',
    },
    {
      service: 'Cut & style',
      dateISO: today,
      time: '9:00 AM',
      clientName: 'Jordan Lee',
      clientPhone: '(310) 555-0188',
      stylist: 'Noor',
    },
    {
      service: 'Gloss + blowout',
      dateISO: today,
      time: '10:00 AM',
      clientName: 'Priya Shah',
      clientPhone: '(424) 555-0190',
      stylist: 'Jordan',
      source: 'ai_receptionist',
    },
    {
      service: 'Color services',
      dateISO: today,
      time: '11:00 AM',
      clientName: 'Sam Rivera',
      clientPhone: '(213) 555-0166',
      stylist: 'Priya',
    },
    {
      service: 'Signature facial',
      dateISO: today,
      time: '1:00 PM',
      clientName: 'Alex Kim',
      clientPhone: '(818) 555-0121',
      stylist: 'Amelia',
    },
    {
      service: 'Cut & style',
      dateISO: today,
      time: '2:00 PM',
      clientName: 'Taylor Brooks',
      clientPhone: '(626) 555-0177',
      stylist: 'Noor',
      source: 'ai_receptionist',
      paymentStatus: 'paid',
    },
    {
      service: 'Balayage',
      dateISO: tomorrow,
      time: '10:00 AM',
      clientName: 'Riley Ortiz',
      clientPhone: '(323) 555-0133',
      stylist: 'Amelia',
    },
    {
      service: 'Haircuts & styling',
      dateISO: tomorrow,
      time: '10:00 AM',
      clientName: 'Casey Nguyen',
      clientPhone: '(310) 555-0199',
      stylist: 'Jordan',
    },
    {
      service: 'Gloss + blowout',
      dateISO: tomorrow,
      time: '2:00 PM',
      clientName: 'Morgan Ellis',
      clientPhone: '(747) 555-0144',
      stylist: 'Priya',
      source: 'ai_receptionist',
    },
  ]

  const appts: Appointment[] = seeds.map((s, i) => ({
    id: `demo-floor-${i + 1}`,
    createdAt: now,
    updatedAt: now,
    status: 'confirmed' as const,
    paymentStatus: s.paymentStatus || 'unpaid',
    service: s.service,
    durationMin: durationForService(s.service),
    dateISO: s.dateISO,
    dateLabel: formatDateLabel(s.dateISO),
    time: s.time,
    startMinutes: parseTimeToMinutes(s.time),
    clientName: s.clientName,
    clientPhone: s.clientPhone,
    stylist: s.stylist,
    notes: 'Demo multi-stylist floor — replace with your real book anytime.',
    source: s.source || 'owner',
  }))

  window.localStorage.setItem(APPT_KEY, JSON.stringify(appts))
  window.localStorage.setItem(DEMO_FLOOR_KEY, '1')
}

export function purgeDemoAppointmentsIfOnboarded() {
  if (!canUseStorage()) return
  if (!isLiveSalonBook()) return
  try {
    const raw = window.localStorage.getItem(APPT_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Appointment[]
    if (!Array.isArray(parsed)) return
    const next = parsed.filter((a) => !isDemoAppointmentId(a.id))
    if (next.length === parsed.length) return
    window.localStorage.setItem(APPT_KEY, JSON.stringify(next))
    window.localStorage.setItem(DEMO_FLOOR_KEY, '1')
    window.localStorage.setItem(REBOOK_HISTORY_KEY, '1')
  } catch {
    /* ignore */
  }
}

function readAppts(): Appointment[] {
  if (!canUseStorage()) return []
  migrateHoldsOnce()
  seedDemoFloorIfEmpty()
  ensureFillTheBookHistory()
  purgeDemoAppointmentsIfOnboarded()
  try {
    const raw = window.localStorage.getItem(APPT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Appointment[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((a) => ({
      ...a,
      paymentStatus: a.paymentStatus || 'unpaid',
    }))
  } catch {
    return []
  }
}

/** Past completed visits so Fill the Book has real rebook / win-back signals. */
function ensureFillTheBookHistory() {
  if (!canUseStorage()) return
  if (isLiveSalonBook()) {
    window.localStorage.setItem(REBOOK_HISTORY_KEY, '1')
    return
  }
  if (window.localStorage.getItem(REBOOK_HISTORY_KEY) === '1') return
  try {
    const raw = window.localStorage.getItem(APPT_KEY)
    const existing = raw ? (JSON.parse(raw) as Appointment[]) : []
    if (!Array.isArray(existing)) {
      window.localStorage.setItem(REBOOK_HISTORY_KEY, '1')
      return
    }
    if (existing.some((a) => a.status === 'completed')) {
      window.localStorage.setItem(REBOOK_HISTORY_KEY, '1')
      return
    }

    const now = new Date().toISOString()
    const past = (daysAgo: number) => {
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      return toISODate(d)
    }
    const extras: Appointment[] = [
      {
        id: 'demo-rebook-maya',
        createdAt: now,
        updatedAt: now,
        status: 'completed',
        paymentStatus: 'paid',
        service: 'Balayage',
        durationMin: 150,
        dateISO: past(70),
        dateLabel: formatDateLabel(past(70)),
        time: '10:00 AM',
        startMinutes: parseTimeToMinutes('10:00 AM'),
        clientName: 'Maya Chen',
        clientPhone: '(310) 555-0142',
        stylist: 'Amelia',
        notes: 'Last color — return window is open.',
        source: 'owner',
      },
      {
        id: 'demo-rebook-sam',
        createdAt: now,
        updatedAt: now,
        status: 'completed',
        paymentStatus: 'paid',
        service: 'Color services',
        durationMin: 120,
        dateISO: past(84),
        dateLabel: formatDateLabel(past(84)),
        time: '11:00 AM',
        startMinutes: parseTimeToMinutes('11:00 AM'),
        clientName: 'Sam Rivera',
        clientPhone: '(213) 555-0166',
        stylist: 'Priya',
        notes: 'Last color — 12 weeks out.',
        source: 'owner',
      },
      {
        id: 'demo-winback-dana',
        createdAt: now,
        updatedAt: now,
        status: 'completed',
        paymentStatus: 'paid',
        service: 'Gloss + blowout',
        durationMin: 60,
        dateISO: past(140),
        dateLabel: formatDateLabel(past(140)),
        time: '2:00 PM',
        startMinutes: parseTimeToMinutes('2:00 PM'),
        clientName: 'Dana Wells',
        clientPhone: '(310) 555-0110',
        stylist: 'Noor',
        notes: 'Quiet 20 weeks — win-back, not a discount blast.',
        source: 'owner',
      },
    ]
    window.localStorage.setItem(APPT_KEY, JSON.stringify([...existing, ...extras]))
    window.localStorage.setItem(REBOOK_HISTORY_KEY, '1')
  } catch {
    window.localStorage.setItem(REBOOK_HISTORY_KEY, '1')
  }
}

function writeAppts(list: Appointment[]) {
  if (!canUseStorage()) throw new Error('localStorage unavailable')
  try {
    window.localStorage.setItem(APPT_KEY, JSON.stringify(list))
  } catch (e) {
    // QuotaExceeded or private mode — surface a clear error instead of opaque crash
    throw new Error(
      e instanceof Error && /quota/i.test(e.message)
        ? 'Browser storage is full — free space or clear old data.'
        : 'Could not save appointments on this device.',
    )
  }
  // Multi-device: debounced cloud push (no-op if sync off / API down)
  void import('./ops-auto-sync')
    .then((m) => m.scheduleCloudPush('appointments'))
    .catch(() => undefined)
}

/** One-time migrate booking holds → appointments */
function migrateHoldsOnce() {
  if (!canUseStorage()) return
  if (window.localStorage.getItem(MIGRATED_KEY) === '1') return
  try {
    const raw = window.localStorage.getItem(HOLDS_KEY)
    if (raw) {
      const holds = JSON.parse(raw) as BookingHold[]
      if (Array.isArray(holds) && holds.length) {
        const existing = (() => {
          try {
            const r = window.localStorage.getItem(APPT_KEY)
            return r ? (JSON.parse(r) as Appointment[]) : []
          } catch {
            return [] as Appointment[]
          }
        })()
        const ids = new Set(existing.map((a) => a.id))
        for (const h of holds) {
          if (ids.has(h.id)) continue
          if (h.status !== 'held') continue
          existing.push({
            id: h.id,
            createdAt: h.createdAt,
            updatedAt: h.createdAt,
            status: 'confirmed',
            paymentStatus: 'unpaid',
            service: h.service,
            durationMin: durationForService(h.service),
            dateISO: h.dateISO,
            dateLabel: h.dateLabel,
            time: h.time,
            startMinutes: parseTimeToMinutes(h.time),
            clientName: h.clientName,
            clientPhone: h.clientPhone,
            stylist: 'Studio',
            notes: h.notes,
            source: 'migrated_hold',
          })
        }
        window.localStorage.setItem(APPT_KEY, JSON.stringify(existing))
      }
    }
  } catch {
    /* ignore migrate errors */
  }
  window.localStorage.setItem(MIGRATED_KEY, '1')
}

export function listAppointments(includeCancelled = false): Appointment[] {
  const all = readAppts()
  const filtered = includeCancelled ? all : all.filter((a) => a.status !== 'cancelled')
  return filtered.sort((a, b) => {
    const c = a.dateISO.localeCompare(b.dateISO)
    if (c !== 0) return c
    return a.startMinutes - b.startMinutes
  })
}

export function listForDay(dateISO: string, includeCancelled = false): Appointment[] {
  return listAppointments(includeCancelled).filter((a) => a.dateISO === dateISO)
}

export function listUpcoming(limit = 20): Appointment[] {
  const today = toISODate(new Date())
  return listAppointments()
    .filter((a) => a.dateISO >= today && a.status === 'confirmed')
    .slice(0, limit)
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

export function hasConflict(
  dateISO: string,
  time: string,
  durationMin: number,
  exceptId?: string,
  stylist?: string,
): boolean {
  const start = parseTimeToMinutes(time)
  const end = start + durationMin
  const stylistKey = (stylist || 'Studio').trim().toLowerCase()
  return listForDay(dateISO).some((a) => {
    if (exceptId && a.id === exceptId) return false
    if (a.status === 'cancelled') return false
    // Multi-stylist: same time is fine on different chairs
    if ((a.stylist || 'Studio').trim().toLowerCase() !== stylistKey) return false
    const aEnd = a.startMinutes + a.durationMin
    return rangesOverlap(start, end, a.startMinutes, aEnd)
  })
}

/** Open starts that fit duration without conflict (per stylist / chair) */
export function getOpenSlots(
  dateISO: string,
  service = 'Service',
  exceptId?: string,
  stylist?: string,
): string[] {
  const durationMin = durationForService(service)
  return SLOT_TIMES.filter((t) => !hasConflict(dateISO, t, durationMin, exceptId, stylist))
}

export type AddAppointmentInput = {
  service: string
  dateISO: string
  dateLabel?: string
  time: string
  clientName: string
  clientPhone: string
  stylist?: string
  notes?: string
  source?: Appointment['source']
  durationMin?: number
}

export function addAppointment(input: AddAppointmentInput): Appointment {
  const durationMin = input.durationMin ?? durationForService(input.service)
  const stylist = (input.stylist || 'Studio').trim()
  if (hasConflict(input.dateISO, input.time, durationMin, undefined, stylist)) {
    throw new Error('That chair is full at that time — pick another opening or stylist.')
  }
  const now = new Date().toISOString()
  const appt: Appointment = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    service: input.service.trim(),
    durationMin,
    dateISO: input.dateISO,
    dateLabel: input.dateLabel || formatDateLabel(input.dateISO),
    time: input.time,
    startMinutes: parseTimeToMinutes(input.time),
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    stylist,
    notes: input.notes,
    source: input.source || 'owner',
  }
  const all = readAppts()
  all.push(appt)
  writeAppts(all)
  // CRM + messaging (dynamic imports avoid circular deps)
  void import('./clients-store')
    .then((m) => {
      m.upsertClientFromBooking({
        name: appt.clientName,
        phone: appt.clientPhone,
        source: appt.source === 'ai_receptionist' ? 'ai_receptionist' : 'from_booking',
      })
    })
    .catch(() => undefined)
  // Phase B: confirm SMS/email, owner alert, optional auto-deposit
  void import('./booking-side-effects')
    .then((m) => m.runBookingSideEffects(appt))
    .catch(() => undefined)
  return appt
}

export function setPaymentStatus(id: string, paymentStatus: PaymentStatus, depositAmount?: string): boolean {
  const all = readAppts()
  const idx = all.findIndex((a) => a.id === id)
  if (idx < 0) return false
  all[idx] = {
    ...all[idx],
    paymentStatus,
    depositAmount: depositAmount ?? all[idx].depositAmount,
    updatedAt: new Date().toISOString(),
  }
  writeAppts(all)
  return true
}

export function cancelAppointment(id: string): boolean {
  const all = readAppts()
  const idx = all.findIndex((a) => a.id === id)
  if (idx < 0) return false
  all[idx] = { ...all[idx], status: 'cancelled', updatedAt: new Date().toISOString() }
  writeAppts(all)
  return true
}

export function rescheduleAppointment(
  id: string,
  dateISO: string,
  time: string,
  dateLabel?: string,
): Appointment {
  const all = readAppts()
  const idx = all.findIndex((a) => a.id === id)
  if (idx < 0) throw new Error('Appointment not found')
  const cur = all[idx]
  if (hasConflict(dateISO, time, cur.durationMin, id, cur.stylist)) {
    throw new Error('That slot conflicts with another booking on this chair.')
  }
  const next: Appointment = {
    ...cur,
    dateISO,
    dateLabel: dateLabel || formatDateLabel(dateISO),
    time,
    startMinutes: parseTimeToMinutes(time),
    updatedAt: new Date().toISOString(),
    status: 'confirmed',
  }
  all[idx] = next
  writeAppts(all)
  return next
}

export function getBusinessDays(count = 5, includeToday = false): DayOption[] {
  const out: DayOption[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  if (!includeToday) cursor.setDate(cursor.getDate() + 1)
  let guard = 0
  while (out.length < count && guard < 28) {
    const dow = cursor.getDay()
    if (dow !== 0) {
      const dateISO = toISODate(cursor)
      out.push({
        dateISO,
        dateLabel: formatDateLabel(dateISO),
        weekday: WEEKDAYS[dow],
      })
    }
    cursor.setDate(cursor.getDate() + 1)
    guard++
  }
  return out
}

/** Days for calendar picker: today + next 13 days (incl weekends for owner view) */
export function getOwnerDays(count = 14): DayOption[] {
  const out: DayOption[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  for (let i = 0; i < count; i++) {
    const dateISO = toISODate(cursor)
    out.push({
      dateISO,
      dateLabel: formatDateLabel(dateISO),
      weekday: WEEKDAYS[cursor.getDay()],
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function mergeServices(salonServices: string[] = []): string[] {
  const set = new Set<string>()
  for (const s of [...salonServices, ...DEFAULT_SERVICES]) {
    const t = s.trim()
    if (t) set.add(t)
  }
  return Array.from(set).slice(0, 10)
}

export function shortHoldCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function isValidPhone(phone: string): boolean {
  return digitsOnly(phone).length >= 7
}

export function matchService(text: string, services: string[]): string | null {
  const t = text.toLowerCase()
  for (const s of services) {
    if (t.includes(s.toLowerCase())) return s
  }
  const aliases: Record<string, string[]> = {
    balayage: ['balayage', 'highlights'],
    gloss: ['gloss', 'toner'],
    cut: ['cut', 'haircut', 'trim', 'style'],
    color: ['color', 'colour', 'dye'],
    facial: ['facial', 'skin'],
  }
  for (const s of services) {
    const key = s.toLowerCase()
    for (const [alias, words] of Object.entries(aliases)) {
      if (key.includes(alias) && words.some((w) => t.includes(w))) return s
    }
  }
  const n = Number.parseInt(t.trim(), 10)
  if (n >= 1 && n <= services.length) return services[n - 1]
  return null
}

export function matchDay(text: string, days: DayOption[]): DayOption | null {
  const t = text.toLowerCase().trim()
  for (const d of days) {
    if (t.includes(d.weekday.toLowerCase())) return d
    if (t.includes(d.dateISO)) return d
  }
  const n = Number.parseInt(t, 10)
  if (n >= 1 && n <= days.length) return days[n - 1]
  if (/(tomorrow|tmrw)/.test(t) && days[0]) {
    // prefer first business day that is "tomorrow-ish"
    return days.find((d) => d.dateISO === toISODate(new Date(Date.now() + 86400000))) || days[0]
  }
  if (/today/.test(t)) {
    const today = toISODate(new Date())
    return days.find((d) => d.dateISO === today) || null
  }
  return null
}

export function matchTime(text: string, slots: string[]): string | null {
  const t = text.toLowerCase().replace(/\s+/g, ' ').trim()
  for (const s of slots) {
    if (t.includes(s.toLowerCase())) return s
    const compact = s.toLowerCase().replace(/\s/g, '')
    if (t.replace(/\s/g, '').includes(compact)) return s
  }
  const n = Number.parseInt(t, 10)
  if (n >= 1 && n <= slots.length) return slots[n - 1]
  return null
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

export function countConfirmedOn(dateISO: string): number {
  return listForDay(dateISO).filter((a) => a.status === 'confirmed').length
}

export function totalBookedMinutes(dateISO: string): number {
  return listForDay(dateISO)
    .filter((a) => a.status === 'confirmed')
    .reduce((sum, a) => sum + a.durationMin, 0)
}

// ── Compat layer for existing booking-hold API ──────────────────────────

export function listHolds(includeCancelled = false): BookingHold[] {
  return listAppointments(includeCancelled).map(apptToHold)
}

export function listUpcomingHolds(limit = 8): BookingHold[] {
  return listUpcoming(limit).map(apptToHold)
}

function apptToHold(a: Appointment): BookingHold {
  return {
    id: a.id,
    createdAt: a.createdAt,
    status: a.status === 'cancelled' ? 'cancelled' : 'held',
    service: a.service,
    dateLabel: a.dateLabel,
    dateISO: a.dateISO,
    time: a.time,
    clientName: a.clientName,
    clientPhone: a.clientPhone,
    notes: a.notes,
    source: 'ai_receptionist',
  }
}

export type AddHoldInput = {
  service: string
  dateLabel: string
  dateISO: string
  time: string
  clientName: string
  clientPhone: string
  notes?: string
}

export function isSlotTaken(dateISO: string, time: string, exceptId?: string): boolean {
  return hasConflict(dateISO, time, 60, exceptId)
}

export function addHold(input: AddHoldInput): BookingHold {
  const appt = addAppointment({
    ...input,
    source: 'ai_receptionist',
  })
  return apptToHold(appt)
}

export function cancelHold(id: string): boolean {
  return cancelAppointment(id)
}

export function clearHolds() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(APPT_KEY)
  window.localStorage.removeItem(HOLDS_KEY)
  window.localStorage.removeItem(MIGRATED_KEY)
}
