/**
 * Multi-device salon ops blob API.
 * GET /api/ops?key=gu_xxx  → snapshot
 * GET /api/ops?email=      → { salonSyncKey } for second-device recovery
 * PUT /api/ops            → { salonSyncKey, appointments, clients, ... }
 *
 * Uses Netlify Blobs when available; falls back to in-memory (dev only).
 */
import type { Config } from '@netlify/functions'
import { mergeById } from '../../src/lib/salon-book-core'

type Snapshot = {
  version: 1
  salonSyncKey: string
  updatedAt: string
  ownerIdentityId?: string
  ownerEmail?: string
  appointments: unknown[]
  clients: unknown[]
  notifications: unknown[]
  settings: Record<string, unknown>
}

type OwnerIndex = {
  salonSyncKey: string
  ownerIdentityId?: string
  ownerEmail?: string
  updatedAt: string
}

// Dev fallback — shared with glo-desk so a local push is visible to Glo
const memory: Map<string, unknown> =
  (globalThis as { __glowupOps?: Map<string, unknown> }).__glowupOps ||
  ((globalThis as { __glowupOps?: Map<string, unknown> }).__glowupOps = new Map())

async function getStore() {
  try {
    const { getStore } = await import('@netlify/blobs')
    return getStore('glowup-ops')
  } catch {
    return null
  }
}

function emailIndexKey(email: string) {
  return `idx-email:${email.trim().toLowerCase()}`
}

function identityIndexKey(id: string) {
  return `idx-id:${id.trim()}`
}

async function loadRaw(key: string): Promise<unknown | null> {
  const store = await getStore()
  if (store) {
    const raw = await store.get(key, { type: 'json' })
    if (raw) return raw
  }
  return memory.get(key) || null
}

async function saveRaw(key: string, value: unknown) {
  const store = await getStore()
  if (store) await store.setJSON(key, value)
  memory.set(key, value)
}

export default async function handler(request: Request) {
  const url = new URL(request.url)

  if (request.method === 'GET') {
    const key = url.searchParams.get('key')?.trim() || ''
    const email = url.searchParams.get('email')?.trim().toLowerCase() || ''
    const identity = url.searchParams.get('identity')?.trim() || ''

    if (!key && email) {
      const idx = (await loadRaw(emailIndexKey(email))) as OwnerIndex | null
      const found = String(idx?.salonSyncKey || '').trim()
      if (!found) return Response.json({ error: 'No salon for this email' }, { status: 404 })
      return Response.json({ salonSyncKey: found, ownerEmail: email })
    }
    if (!key && identity) {
      const idx = (await loadRaw(identityIndexKey(identity))) as OwnerIndex | null
      const found = String(idx?.salonSyncKey || '').trim()
      if (!found) return Response.json({ error: 'No salon for this identity' }, { status: 404 })
      return Response.json({ salonSyncKey: found, ownerIdentityId: identity })
    }
    if (!key || key.length < 8) {
      return Response.json({ error: 'Missing salon key' }, { status: 400 })
    }
    const raw = await loadRaw(key)
    if (!raw) return Response.json({ error: 'Salon not found' }, { status: 404 })
    return Response.json(raw)
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    let body: Snapshot
    try {
      body = (await request.json()) as Snapshot
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const key = body.salonSyncKey?.trim()
    if (!key || key.length < 8) {
      return Response.json({ error: 'salonSyncKey required' }, { status: 400 })
    }
    const ownerEmail = String(body.ownerEmail || body.settings?.ownerEmail || '')
      .trim()
      .toLowerCase()
    const ownerIdentityId = String(body.ownerIdentityId || body.settings?.ownerIdentityId || '').trim()
    const incoming: Snapshot = {
      version: 1,
      salonSyncKey: key,
      updatedAt: new Date().toISOString(),
      ownerIdentityId,
      ownerEmail,
      appointments: Array.isArray(body.appointments) ? body.appointments : [],
      clients: Array.isArray(body.clients) ? body.clients : [],
      notifications: Array.isArray(body.notifications) ? body.notifications : [],
      settings: body.settings && typeof body.settings === 'object' ? body.settings : {},
    }
    const existing = (await loadRaw(key)) as Snapshot | null
    const snap: Snapshot = existing
      ? {
          ...incoming,
          appointments: mergeById(existing.appointments, incoming.appointments),
          clients: mergeById(existing.clients, incoming.clients),
          notifications: mergeById(existing.notifications, incoming.notifications),
        }
      : incoming
    await saveRaw(key, snap)
    if (snap.ownerEmail) {
      await saveRaw(emailIndexKey(snap.ownerEmail), {
        salonSyncKey: snap.salonSyncKey,
        ownerIdentityId: snap.ownerIdentityId || '',
        updatedAt: snap.updatedAt,
      })
    }
    if (snap.ownerIdentityId) {
      await saveRaw(identityIndexKey(snap.ownerIdentityId), {
        salonSyncKey: snap.salonSyncKey,
        ownerEmail: snap.ownerEmail || '',
        updatedAt: snap.updatedAt,
      })
    }
    return Response.json({ ok: true, updatedAt: snap.updatedAt, salonSyncKey: key })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = { path: '/api/ops' }
