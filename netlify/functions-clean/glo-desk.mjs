/**
 * Public Glo front desk — book/reschedule/cancel on the salon cloud book.
 * GET  /api/glo/desk?key=gu_xxx  → public view + salonKey
 * POST /api/glo/desk             → { action, salonKey, ... }
 *
 * Storage: Netlify Blobs store "glowup-ops" (same as ops.mjs).
 */

const STORE = 'glowup-ops'
const NOT_FOUND =
  'Salon not found. Owner must Push cloud book from Dashboard → Ops first.'

const DEFAULT_SERVICES = [
  'Cut & style',
  'Balayage',
  'Gloss + blowout',
  'Color services',
  'Signature facial',
  'Haircuts & styling',
]

const DEFAULT_HOURS = 'Monday–Saturday 9:00 AM–4:00 PM'

const SLOT_TIMES = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
]

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function json(status, body) {
  return { statusCode: status, headers: cors(), body: JSON.stringify(body) }
}

/** @type {Map<string, object>} */
const memory = globalThis.__glowupOps || (globalThis.__glowupOps = new Map())

async function getStore() {
  try {
    const { getStore } = await import('@netlify/blobs')
    return getStore(STORE)
  } catch {
    return null
  }
}

async function loadSnap(key) {
  const store = await getStore()
  if (store) {
    try {
      const raw = await store.get(key, { type: 'json' })
      if (raw && typeof raw === 'object') return raw
    } catch {
      /* empty */
    }
  }
  return memory.get(key) || null
}

async function saveSnap(key, snap) {
  const store = await getStore()
  if (store) {
    await store.setJSON(key, snap)
  }
  memory.set(key, snap)
}

async function resolveAdminSnap(publicOrAdminKey) {
  const key = String(publicOrAdminKey || '').trim()
  if (!key) return null
  if (key.startsWith('gd_')) {
    const idx = await loadSnap(`idx-desk:${key}`)
    const admin = idx && typeof idx === 'object' ? String(idx.salonSyncKey || '').trim() : ''
    if (!admin) return null
    const snap = await loadSnap(admin)
    return snap ? { snap, adminKey: admin, deskKey: key } : null
  }
  const snap = await loadSnap(key)
  return snap ? { snap, adminKey: String(snap.salonSyncKey || key), deskKey: snap.deskKey || '' } : null
}

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateLabel(dateISO) {
  const d = new Date(dateISO + 'T12:00:00')
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function parseTimeToMinutes(time) {
  const m = String(time || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return 0
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = m[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + min
}

function durationForService(service) {
  const s = String(service || '').toLowerCase()
  if (s.includes('balayage') || s.includes('dimensional')) return 150
  if (s.includes('color') || s.includes('colour')) return 120
  if (s.includes('gloss')) return 60
  if (s.includes('facial') || s.includes('skin')) return 60
  if (s.includes('cut') || s.includes('style') || s.includes('haircut')) return 60
  if (s.includes('nail')) return 45
  return 60
}

function shortHoldCode(id) {
  return String(id || '')
    .replace(/-/g, '')
    .slice(0, 6)
    .toUpperCase()
}

function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function last7(phone) {
  return digitsOnly(phone).slice(-7)
}

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

function getBusinessDays(count = 5, includeToday = false) {
  const out = []
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

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

function hasConflict(appts, dateISO, time, durationMin, exceptId, stylist) {
  const start = parseTimeToMinutes(time)
  const end = start + durationMin
  const stylistKey = String(stylist || 'Studio')
    .trim()
    .toLowerCase()
  return appts.some((a) => {
    if (a.dateISO !== dateISO) return false
    if (exceptId && a.id === exceptId) return false
    if (a.status === 'cancelled') return false
    if (
      String(a.stylist || 'Studio')
        .trim()
        .toLowerCase() !== stylistKey
    ) {
      return false
    }
    const aStart = a.startMinutes || parseTimeToMinutes(a.time)
    const aEnd = aStart + (a.durationMin || durationForService(a.service))
    return rangesOverlap(start, end, aStart, aEnd)
  })
}

function getOpenSlots(appts, dateISO, service, exceptId, stylist) {
  const durationMin = durationForService(service || 'Service')
  return SLOT_TIMES.filter((t) => !hasConflict(appts, dateISO, t, durationMin, exceptId, stylist))
}

function asAppointments(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const a of raw) {
    if (!a || typeof a !== 'object' || !a.id || !a.dateISO || !a.time) continue
    out.push({
      id: a.id,
      createdAt: a.createdAt || '',
      updatedAt: a.updatedAt || '',
      status: a.status || 'confirmed',
      paymentStatus: a.paymentStatus || 'unpaid',
      depositAmount: a.depositAmount,
      service: a.service || 'Service',
      durationMin: typeof a.durationMin === 'number' ? a.durationMin : durationForService(a.service || 'Service'),
      dateISO: a.dateISO,
      dateLabel: a.dateLabel || formatDateLabel(a.dateISO),
      time: a.time,
      startMinutes: typeof a.startMinutes === 'number' ? a.startMinutes : parseTimeToMinutes(a.time),
      clientName: a.clientName || '',
      clientPhone: a.clientPhone || '',
      clientEmail: a.clientEmail,
      stylist: a.stylist || 'Studio',
      notes: a.notes,
      source: a.source || 'owner',
    })
  }
  return out
}

function asClients(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const c of raw) {
    if (!c || typeof c !== 'object' || !c.id) continue
    out.push({
      id: c.id,
      createdAt: c.createdAt || '',
      updatedAt: c.updatedAt || '',
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
      formulas: c.formulas || '',
      preferences: c.preferences || '',
      source: c.source || 'from_booking',
    })
  }
  return out
}

function readServices(settings) {
  const raw = settings?.services
  if (Array.isArray(raw)) {
    const list = raw.map((s) => String(s).trim()).filter(Boolean)
    if (list.length) return list.slice(0, 12)
  }
  return [...DEFAULT_SERVICES]
}

function publicDeskView(snap, service) {
  const settings = snap?.settings && typeof snap.settings === 'object' ? snap.settings : {}
  const appts = asAppointments(snap?.appointments)
  const services = readServices(settings)
  const slotService = String(service || services[0] || 'Service').trim()
  const studioName =
    typeof settings.studioName === 'string' && settings.studioName.trim()
      ? settings.studioName.trim()
      : 'Studio'
  const city = typeof settings.city === 'string' ? settings.city.trim() : ''
  const hours =
    typeof settings.hours === 'string' && settings.hours.trim() ? settings.hours.trim() : DEFAULT_HOURS
  const days = getBusinessDays(7, true).map((d) => ({
    ...d,
    slots: getOpenSlots(appts, d.dateISO, slotService),
  }))
  return { studioName, city, hours, services, days }
}

function buildAppointment(input) {
  const now = new Date().toISOString()
  const durationMin = input.durationMin ?? durationForService(input.service)
  const stylist = String(input.stylist || 'Studio').trim() || 'Studio'
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    service: String(input.service || '').trim(),
    durationMin,
    dateISO: input.dateISO,
    dateLabel: input.dateLabel || formatDateLabel(input.dateISO),
    time: input.time,
    startMinutes: parseTimeToMinutes(input.time),
    clientName: String(input.clientName || '').trim(),
    clientPhone: String(input.clientPhone || '').trim(),
    stylist,
    notes: input.notes,
    source: input.source || 'ai_receptionist',
  }
}

function applyBook(appts, input) {
  const service = String(input.service || '').trim()
  const dateISO = String(input.dateISO || '').trim()
  const time = String(input.time || '').trim()
  const clientName = String(input.clientName || '').trim()
  const clientPhone = String(input.clientPhone || '').trim()
  if (!service || !dateISO || !time || !clientName || !clientPhone) {
    return { ok: false, error: 'service, dateISO, time, clientName, and clientPhone are required.' }
  }
  if (last7(clientPhone).length < 7) {
    return { ok: false, error: 'Enter a valid phone number.' }
  }
  const durationMin = input.durationMin ?? durationForService(service)
  const stylist = String(input.stylist || 'Studio').trim() || 'Studio'
  if (hasConflict(appts, dateISO, time, durationMin, undefined, stylist)) {
    return { ok: false, error: 'That chair is full at that time — pick another opening or stylist.' }
  }
  return {
    ok: true,
    appointment: buildAppointment({
      ...input,
      service,
      dateISO,
      time,
      clientName,
      clientPhone,
      stylist,
      durationMin,
    }),
  }
}

function findLatestConfirmed(appts, clientPhone) {
  const needle = last7(clientPhone)
  if (needle.length < 7) return undefined
  const hits = appts.filter((a) => {
    if (a.status !== 'confirmed') return false
    const d = digitsOnly(a.clientPhone)
    return d.endsWith(needle) || needle.endsWith(d.slice(-7))
  })
  if (!hits.length) return undefined
  return [...hits].sort((a, b) => {
    const c = b.dateISO.localeCompare(a.dateISO)
    if (c !== 0) return c
    const bStart = b.startMinutes || parseTimeToMinutes(b.time)
    const aStart = a.startMinutes || parseTimeToMinutes(a.time)
    if (bStart !== aStart) return bStart - aStart
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  })[0]
}

function applyReschedule(appts, input) {
  const clientPhone = String(input.clientPhone || '').trim()
  const dateISO = String(input.dateISO || '').trim()
  const time = String(input.time || '').trim()
  if (!clientPhone || !dateISO || !time) {
    return { ok: false, error: 'clientPhone, dateISO, and time are required.' }
  }
  if (last7(clientPhone).length < 7) {
    return { ok: false, error: 'Enter a valid phone number.' }
  }
  const cur = findLatestConfirmed(appts, clientPhone)
  if (!cur) {
    return { ok: false, error: 'No confirmed appointment found for that phone.' }
  }
  if (hasConflict(appts, dateISO, time, cur.durationMin, cur.id, cur.stylist)) {
    return { ok: false, error: 'That slot conflicts with another booking on this chair.' }
  }
  return {
    ok: true,
    appointment: {
      ...cur,
      dateISO,
      dateLabel: formatDateLabel(dateISO),
      time,
      startMinutes: parseTimeToMinutes(time),
      updatedAt: new Date().toISOString(),
      status: 'confirmed',
    },
  }
}

function applyCancel(appts, input) {
  const clientPhone = String(input.clientPhone || '').trim()
  if (!clientPhone) {
    return { ok: false, error: 'clientPhone is required.' }
  }
  if (last7(clientPhone).length < 7) {
    return { ok: false, error: 'Enter a valid phone number.' }
  }
  const cur = findLatestConfirmed(appts, clientPhone)
  if (!cur) {
    return { ok: false, error: 'No confirmed appointment found for that phone.' }
  }
  return {
    ok: true,
    appointment: {
      ...cur,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    },
  }
}

function upsertClient(clients, input) {
  const now = new Date().toISOString()
  const name = String(input.name || '').trim()
  const phone = String(input.phone || '').trim()
  const needle = last7(phone)
  const existing =
    needle.length >= 7
      ? clients.find((c) => {
          const d = digitsOnly(c.phone)
          return d.endsWith(needle) || needle.endsWith(d.slice(-7))
        })
      : undefined
  if (existing) {
    const client = {
      ...existing,
      name: name || existing.name,
      phone: phone || existing.phone,
      email: String(input.email || existing.email || '').trim() || existing.email,
      updatedAt: now,
      source: input.source || existing.source,
    }
    return {
      client,
      clients: clients.map((c) => (c.id === existing.id ? client : c)),
    }
  }
  const client = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    name,
    phone,
    email: String(input.email || '').trim(),
    notes: '',
    formulas: '',
    preferences: '',
    source: input.source || 'ai_receptionist',
  }
  return { client, clients: [...clients, client] }
}

function persist(snap, appointments, clients) {
  return {
    ...snap,
    version: 1,
    salonSyncKey: snap.salonSyncKey,
    updatedAt: new Date().toISOString(),
    appointments,
    clients: clients ?? (Array.isArray(snap.clients) ? snap.clients : []),
    notifications: Array.isArray(snap.notifications) ? snap.notifications : [],
    settings: snap.settings && typeof snap.settings === 'object' ? snap.settings : {},
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }

  if (event.httpMethod === 'GET') {
    const key = (event.queryStringParameters?.key || '').trim()
    if (!key || key.length < 8) {
      return json(400, { error: 'Missing salon key' })
    }
    const resolved = await resolveAdminSnap(key)
    if (!resolved) return json(404, { error: NOT_FOUND, salonKey: key })
    return json(200, {
      ok: true,
      salonKey: resolved.deskKey || key,
      ...publicDeskView(resolved.snap),
    })
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const salonKey = String(body.salonKey || '').trim()
  if (!salonKey || salonKey.length < 8) {
    return json(400, { error: 'salonKey required' })
  }

  const resolved = await resolveAdminSnap(salonKey)
  if (!resolved) return json(404, { error: NOT_FOUND })
  const snap = resolved.snap
  const adminKey = resolved.adminKey

  const appointments = asAppointments(snap.appointments)
  const clients = asClients(snap.clients)
  const action = String(body.action || '').trim()

  if (action === 'slots') {
    const view = publicDeskView(snap)
    const service = String(body.service || '').trim() || view.services[0] || 'Service'
    const dateISO = String(body.dateISO || '').trim()
    if (dateISO) {
      return json(200, { ok: true, salonKey, service, dateISO, slots: getOpenSlots(appointments, dateISO, service) })
    }
    const days = getBusinessDays(7, true).map((d) => ({
      ...d,
      slots: getOpenSlots(appointments, d.dateISO, service),
    }))
    return json(200, { ok: true, salonKey, service, days })
  }

  if (action === 'book') {
    const result = applyBook(appointments, {
      service: body.service || '',
      dateISO: body.dateISO || '',
      time: body.time || '',
      clientName: body.clientName || '',
      clientPhone: body.clientPhone || '',
      clientEmail: body.clientEmail || '',
      stylist: 'Studio',
      source: 'ai_receptionist',
    })
    if (!result.ok || !result.appointment) {
      return json(409, { ok: false, error: result.error || 'Could not book' })
    }
    if (body.clientEmail) result.appointment.clientEmail = String(body.clientEmail).trim()
    const nextAppts = [...appointments, result.appointment]
    const nextClients = upsertClient(clients, {
      name: result.appointment.clientName,
      phone: result.appointment.clientPhone,
      email: result.appointment.clientEmail || body.clientEmail || '',
      source: 'ai_receptionist',
    })
    const nextSnap = persist(snap, nextAppts, nextClients.clients)
    await saveSnap(adminKey, nextSnap)
    const code = shortHoldCode(result.appointment.id)
    try {
      const { sendResendEmail } = await import('./_lib/send-resend.mjs')
      const settings = nextSnap.settings && typeof nextSnap.settings === 'object' ? nextSnap.settings : {}
      const studio = String(settings.studioName || 'Studio')
      const guestEmail = String(result.appointment.clientEmail || body.clientEmail || '').trim()
      const ownerEmail = String(settings.ownerNotifyEmail || nextSnap.ownerEmail || '').trim()
      const bodyText = [
        `Hi ${result.appointment.clientName},`,
        ``,
        `You're confirmed at ${studio}:`,
        `${result.appointment.service}`,
        `${result.appointment.dateLabel} at ${result.appointment.time}`,
        ``,
        `Confirmation: ${code}`,
        ``,
        `— ${studio} (via GlowUP.)`,
      ].join('\n')
      if (guestEmail.includes('@') && settings.messagingEnabled !== false) {
        await sendResendEmail({
          to: guestEmail,
          subject: `Confirmed: ${result.appointment.service} · ${result.appointment.dateLabel}`,
          text: bodyText,
          replyTo: ownerEmail,
        })
      }
      if (ownerEmail.includes('@') && settings.autoOwnerAlert !== false && settings.messagingEnabled !== false) {
        await sendResendEmail({
          to: ownerEmail,
          subject: `New booking · ${result.appointment.clientName}`,
          text: `New booking: ${result.appointment.clientName} · ${result.appointment.service} · ${result.appointment.dateLabel} ${result.appointment.time}`,
          replyTo: ownerEmail,
        })
      }
    } catch {
      /* booking still saved if mail fails */
    }
    return json(200, {
      ok: true,
      salonKey: resolved.deskKey || salonKey,
      confirmation_code: code,
      confirmation: code,
      appointment: result.appointment,
    })
  }

  if (action === 'reschedule') {
    const result = applyReschedule(appointments, {
      clientPhone: body.clientPhone || '',
      dateISO: body.dateISO || '',
      time: body.time || '',
    })
    if (!result.ok || !result.appointment) {
      return json(409, { ok: false, error: result.error || 'Could not reschedule' })
    }
    const nextAppts = appointments.map((a) => (a.id === result.appointment.id ? result.appointment : a))
    await saveSnap(adminKey, persist(snap, nextAppts))
    return json(200, { ok: true, salonKey: resolved.deskKey || salonKey, appointment: result.appointment })
  }

  if (action === 'cancel') {
    const result = applyCancel(appointments, { clientPhone: body.clientPhone || '' })
    if (!result.ok || !result.appointment) {
      return json(409, { ok: false, error: result.error || 'Could not cancel' })
    }
    const code = shortHoldCode(result.appointment.id)
    const given = String(body.confirmation || body.confirmation_code || '').trim().toUpperCase()
    if (!given || given !== code) {
      return json(403, { ok: false, error: 'Confirmation code required to cancel.' })
    }
    const nextAppts = appointments.map((a) => (a.id === result.appointment.id ? result.appointment : a))
    await saveSnap(adminKey, persist(snap, nextAppts))
    return json(200, { ok: true, salonKey: resolved.deskKey || salonKey, appointment: result.appointment })
  }

  return json(400, { error: 'Unknown action. Use slots, book, reschedule, or cancel.' })
}
