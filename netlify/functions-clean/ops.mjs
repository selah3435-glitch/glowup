/**
 * Multi-device salon ops book (Phase A spine).
 * GET  /api/ops?key=gu_xxx  → snapshot JSON
 * PUT  /api/ops             → full snapshot body (last-write-wins)
 *
 * Storage: Netlify Blobs store "glowup-ops" with in-memory fallback (dev).
 */

const STORE = 'glowup-ops'

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
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

function recordTs(item) {
  return Date.parse(item?.updatedAt || item?.createdAt || '') || 0
}

function mergeById(a, b) {
  const left = Array.isArray(a) ? a : []
  const right = Array.isArray(b) ? b : []
  const map = new Map()
  for (const item of [...left, ...right]) {
    if (!item || typeof item !== 'object' || !item.id) continue
    const prev = map.get(item.id)
    const nextTs = recordTs(item)
    const prevTs = prev ? recordTs(prev) : -1
    if (!prev || nextTs >= prevTs) map.set(item.id, item)
  }
  return Array.from(map.values())
}

function emailIndexKey(email) {
  return `idx-email:${String(email || '').trim().toLowerCase()}`
}

function identityIndexKey(id) {
  return `idx-id:${String(id || '').trim()}`
}

function deskIndexKey(deskKey) {
  return `idx-desk:${String(deskKey || '').trim()}`
}

function newDeskKey() {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `gd_${id}`
}

function publicDeskView(snap) {
  const settings = snap?.settings && typeof snap.settings === 'object' ? snap.settings : {}
  const appts = Array.isArray(snap?.appointments) ? snap.appointments : []
  const busy = appts
    .filter((a) => a && a.status !== 'cancelled')
    .map((a) => ({ dateISO: a.dateISO, time: a.time, status: a.status }))
  return {
    ok: true,
    view: 'desk',
    deskKey: snap.deskKey || '',
    studioName: String(settings.studioName || 'Studio'),
    city: String(settings.city || ''),
    hours: String(settings.hours || ''),
    services: Array.isArray(settings.services) ? settings.services : [],
    busy,
  }
}

function normalizeSnapshot(body) {
  const key = String(body.salonSyncKey || '').trim()
  if (!key || key.length < 8) return null
  if (key.startsWith('gd_')) return null
  const deskKey = String(body.deskKey || body.settings?.deskKey || '').trim()
  return {
    version: 1,
    salonSyncKey: key,
    deskKey: deskKey.startsWith('gd_') ? deskKey : '',
    updatedAt: new Date().toISOString(),
    ownerIdentityId: String(body.ownerIdentityId || body.settings?.ownerIdentityId || '').trim(),
    ownerEmail: String(body.ownerEmail || body.settings?.ownerEmail || '')
      .trim()
      .toLowerCase(),
    appointments: Array.isArray(body.appointments) ? body.appointments : [],
    clients: Array.isArray(body.clients) ? body.clients : [],
    notifications: Array.isArray(body.notifications) ? body.notifications : [],
    settings: body.settings && typeof body.settings === 'object' ? body.settings : {},
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }

  if (event.httpMethod === 'GET') {
    const key = (event.queryStringParameters?.key || '').trim()
    const email = (event.queryStringParameters?.email || '').trim().toLowerCase()
    const identity = (event.queryStringParameters?.identity || '').trim()

    if (!key && (email || identity)) {
      const admin = process.env.PLATFORM_ADMIN_TOKEN || ''
      const auth = event.headers.authorization || event.headers.Authorization || ''
      const bearer = String(auth).replace(/^Bearer\s+/i, '').trim()
      if (!admin || bearer !== admin) {
        return json(401, { error: 'Lookup by email or identity requires admin auth' })
      }
    }
    if (!key && email) {
      const idx = await loadSnap(emailIndexKey(email))
      const found = idx && typeof idx === 'object' ? String(idx.salonSyncKey || '').trim() : ''
      if (!found) return json(404, { error: 'No salon for this email' })
      return json(200, { salonSyncKey: found, ownerEmail: email })
    }
    if (!key && identity) {
      const idx = await loadSnap(identityIndexKey(identity))
      const found = idx && typeof idx === 'object' ? String(idx.salonSyncKey || '').trim() : ''
      if (!found) return json(404, { error: 'No salon for this identity' })
      return json(200, { salonSyncKey: found, ownerIdentityId: identity })
    }
    if (!key || key.length < 8) {
      return json(400, { error: 'Missing salon key (?key=gu_…)' })
    }
    if (key.startsWith('gd_')) {
      const idx = await loadSnap(deskIndexKey(key))
      const admin = idx && typeof idx === 'object' ? String(idx.salonSyncKey || '').trim() : ''
      const snap = admin ? await loadSnap(admin) : null
      if (!snap) return json(404, { error: 'Salon not found', deskKey: key })
      return json(200, publicDeskView(snap))
    }
    const snap = await loadSnap(key)
    if (!snap) {
      return json(404, { error: 'Salon not found', salonSyncKey: key })
    }
    const auth = event.headers.authorization || event.headers.Authorization || ''
    const bearer = String(auth).replace(/^Bearer\s+/i, '').trim()
    if (bearer !== key) {
      return json(200, publicDeskView(snap))
    }
    return json(200, snap)
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
    let body
    try {
      body = JSON.parse(event.body || '{}')
    } catch {
      return json(400, { error: 'Invalid JSON' })
    }
    const incoming = normalizeSnapshot(body)
    if (!incoming) {
      return json(400, { error: 'salonSyncKey required (min 8 chars, owner key not desk key)' })
    }
    const auth = event.headers.authorization || event.headers.Authorization || ''
    const bearer = String(auth).replace(/^Bearer\s+/i, '').trim()
    if (bearer && bearer !== incoming.salonSyncKey) {
      return json(403, { error: 'Authorization does not match salonSyncKey' })
    }
    const existing = await loadSnap(incoming.salonSyncKey)
    let deskKey = incoming.deskKey || existing?.deskKey || ''
    if (!deskKey || !String(deskKey).startsWith('gd_')) deskKey = newDeskKey()
    const snap = existing
      ? {
          ...incoming,
          deskKey,
          appointments: mergeById(existing.appointments, incoming.appointments),
          clients: mergeById(existing.clients, incoming.clients),
          notifications: mergeById(existing.notifications, incoming.notifications),
        }
      : { ...incoming, deskKey }
    await saveSnap(snap.salonSyncKey, snap)
    await saveSnap(deskIndexKey(deskKey), {
      salonSyncKey: snap.salonSyncKey,
      deskKey,
      updatedAt: snap.updatedAt,
    })
    if (snap.ownerEmail) {
      await saveSnap(emailIndexKey(snap.ownerEmail), {
        salonSyncKey: snap.salonSyncKey,
        ownerIdentityId: snap.ownerIdentityId || '',
        updatedAt: snap.updatedAt,
      })
    }
    if (snap.ownerIdentityId) {
      await saveSnap(identityIndexKey(snap.ownerIdentityId), {
        salonSyncKey: snap.salonSyncKey,
        ownerEmail: snap.ownerEmail || '',
        updatedAt: snap.updatedAt,
      })
    }
    return json(200, {
      ok: true,
      updatedAt: snap.updatedAt,
      salonSyncKey: snap.salonSyncKey,
      deskKey: snap.deskKey,
      counts: {
        appointments: snap.appointments.length,
        clients: snap.clients.length,
        notifications: snap.notifications.length,
      },
    })
  }

  return json(405, { error: 'Method not allowed' })
}
