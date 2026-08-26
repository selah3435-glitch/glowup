/**
 * Public Glo desk — read/write a salon cloud book.
 * GET  /api/glo/desk?key=gu_xxx
 * POST /api/glo/desk  { action, salonKey, ... }
 */
import type { Config } from '@netlify/functions'
import {
  applyBook,
  applyCancel,
  applyReschedule,
  asAppointments,
  asClients,
  getBusinessDays,
  getOpenSlots,
  publicDeskView,
  shortHoldCode,
  upsertClient,
} from '../../src/lib/salon-book-core'

type Snapshot = {
  version: 1
  salonSyncKey: string
  updatedAt: string
  appointments: unknown[]
  clients: unknown[]
  notifications: unknown[]
  settings: Record<string, unknown>
  ownerIdentityId?: string
  ownerEmail?: string
}

type GloMemory = Map<string, Snapshot>
const gloGlobal = globalThis as typeof globalThis & { __glowupOps?: GloMemory }
const memory: GloMemory = gloGlobal.__glowupOps || (gloGlobal.__glowupOps = new Map())

async function getStore() {
  try {
    const { getStore } = await import('@netlify/blobs')
    return getStore('glowup-ops')
  } catch {
    return null
  }
}

async function loadSnap(key: string): Promise<Snapshot | null> {
  const store = await getStore()
  if (store) {
    try {
      const raw = (await store.get(key, { type: 'json' })) as Snapshot | null
      if (raw && typeof raw === 'object') return raw
    } catch {
      /* empty */
    }
  }
  return (memory.get(key) as Snapshot | undefined) || null
}

async function saveSnap(key: string, snap: Snapshot) {
  const store = await getStore()
  if (store) await store.setJSON(key, snap)
  memory.set(key, snap)
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}

function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: cors() })
}

const NOT_FOUND =
  'Salon not found. Owner must Push cloud book from Dashboard → Ops first.'

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() })
  }

  if (request.method === 'GET') {
    const key = new URL(request.url).searchParams.get('key')?.trim() || ''
    if (key.length < 8) return json(400, { error: 'Missing salon key' })
    const snap = await loadSnap(key)
    if (!snap) return json(404, { error: NOT_FOUND, salonKey: key })
    return json(200, { ok: true, salonKey: key, ...publicDeskView(snap) })
  }

  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const salonKey = String(body.salonKey || body.key || '').trim()
  const action = String(body.action || '').trim()
  if (salonKey.length < 8) return json(400, { error: 'salonKey required' })

  const snap = await loadSnap(salonKey)
  if (!snap) return json(404, { error: NOT_FOUND, salonKey })

  const appts = asAppointments(snap.appointments)

  if (action === 'slots') {
    const view = publicDeskView(snap)
    const service = String(body.service || view.services[0] || 'Service')
    const dateISO = String(body.dateISO || '')
    if (dateISO) {
      return json(200, { ok: true, salonKey, service, dateISO, slots: getOpenSlots(appts, dateISO, service) })
    }
    const days = getBusinessDays(7).map((d) => ({
      ...d,
      slots: getOpenSlots(appts, d.dateISO, service),
    }))
    return json(200, { ok: true, salonKey, service, days })
  }

  if (action === 'book') {
    const latest = (await loadSnap(salonKey)) || snap
    const latestAppts = asAppointments(latest.appointments)
    const latestClients = asClients(latest.clients)
    const result = applyBook(latestAppts, {
      service: String(body.service || ''),
      dateISO: String(body.dateISO || ''),
      time: String(body.time || ''),
      clientName: String(body.clientName || ''),
      clientPhone: String(body.clientPhone || ''),
      stylist: 'Studio',
      source: 'ai_receptionist',
    })
    if (!result.ok) return json(409, { ok: false, error: result.error, slots: getOpenSlots(latestAppts, String(body.dateISO || ''), String(body.service || 'Service')) })
    const next: Snapshot = {
      ...latest,
      updatedAt: new Date().toISOString(),
      appointments: [...latestAppts, result.appointment],
      clients: upsertClient(latestClients, {
        name: result.appointment.clientName,
        phone: result.appointment.clientPhone,
        source: 'ai_receptionist',
      }),
    }
    await saveSnap(salonKey, next)
    return json(200, {
      ok: true,
      salonKey,
      confirmation_code: shortHoldCode(result.appointment.id),
      confirmation: shortHoldCode(result.appointment.id),
      appointment: result.appointment,
    })
  }

  if (action === 'reschedule') {
    const latest = (await loadSnap(salonKey)) || snap
    const result = applyReschedule(asAppointments(latest.appointments), {
      clientPhone: String(body.clientPhone || ''),
      dateISO: String(body.dateISO || ''),
      time: String(body.time || ''),
    })
    if (!result.ok) return json(409, { ok: false, error: result.error })
    const next: Snapshot = { ...latest, updatedAt: new Date().toISOString(), appointments: result.appointments }
    await saveSnap(salonKey, next)
    return json(200, {
      ok: true,
      confirmation_code: shortHoldCode(result.appointment.id),
      appointment: result.appointment,
    })
  }

  if (action === 'cancel') {
    const latest = (await loadSnap(salonKey)) || snap
    const result = applyCancel(asAppointments(latest.appointments), { clientPhone: String(body.clientPhone || '') })
    if (!result.ok) return json(409, { ok: false, error: result.error })
    const next: Snapshot = { ...latest, updatedAt: new Date().toISOString(), appointments: result.appointments }
    await saveSnap(salonKey, next)
    return json(200, { ok: true, appointment: result.appointment })
  }

  return json(400, { error: 'Unknown action. Use slots, book, reschedule, or cancel.' })
}

export const config: Config = { path: '/api/glo/desk' }
