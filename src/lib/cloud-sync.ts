/**
 * Multi-device salon sync (Phase A).
 * Primary: PUT/GET /api/ops with salonSyncKey (Netlify Blobs via functions-clean/ops).
 * Fallback: export/import JSON for manual multi-device if API is down.
 */

import { listAppointments, purgeDemoAppointmentsIfOnboarded } from './calendar-store'
import { listClients } from './clients-store'
import { loadSalonContext, saveSalonContext } from './demo-salon'
import { listMessages, replaceAllMessages, type OutboundMessage } from './notifications-store'
import { ensureDeskKey, ensureSalonSyncKey, loadOpsSettings, saveOpsSettings, type OpsSettings } from './ops-settings'

export type OpsSnapshot = {
  version: 1
  salonSyncKey: string
  deskKey?: string
  updatedAt: string
  ownerIdentityId?: string
  ownerEmail?: string
  appointments: unknown[]
  clients: unknown[]
  notifications: OutboundMessage[]
  settings: Partial<OpsSettings> & {
    ownerIdentityId?: string
    ownerEmail?: string
  }
}

const IDENTITY_META_KEY = 'glowup_ops_identity_v1'

export function setCloudIdentityMeta(meta: { identityUserId?: string; email?: string }) {
  if (typeof window === 'undefined') return
  try {
    const prev = getCloudIdentityMeta()
    window.localStorage.setItem(
      IDENTITY_META_KEY,
      JSON.stringify({
        identityUserId: meta.identityUserId ?? prev.identityUserId ?? '',
        email: (meta.email ?? prev.email ?? '').toLowerCase(),
      }),
    )
  } catch {
    /* ignore */
  }
}

export function getCloudIdentityMeta(): { identityUserId: string; email: string } {
  if (typeof window === 'undefined') return { identityUserId: '', email: '' }
  try {
    const raw = window.localStorage.getItem(IDENTITY_META_KEY)
    if (!raw) return { identityUserId: '', email: '' }
    const p = JSON.parse(raw) as { identityUserId?: string; email?: string }
    return {
      identityUserId: String(p.identityUserId || ''),
      email: String(p.email || '').toLowerCase(),
    }
  } catch {
    return { identityUserId: '', email: '' }
  }
}

const APPT_KEY = 'glowup_appointments_v1'
const CLIENT_KEY = 'glowup_clients_v1'

function canUse() {
  return typeof window !== 'undefined'
}

/** Public Glo desk path for a salon key */
export function salonDeskPath(key: string): string {
  return `/book/${key}`
}

/** Absolute desk URL when window is available; otherwise the path. */
export function salonDeskUrl(key: string): string {
  const path = salonDeskPath(key)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }
  return path
}

/** Point Brand booking URL at this salon’s Glo desk unless the owner already set a real URL. */
export function ensureSalonDeskBookingUrl(): string {
  ensureSalonSyncKey()
  const key = ensureDeskKey()
  const url = salonDeskUrl(key)
  if (typeof window === 'undefined') return url
  const salon = loadSalonContext()
  const current = (salon.externalBookingUrl || '').trim()
  const looksUnset =
    !current ||
    current === '#' ||
    /\/book\/?$/i.test(current) ||
    (/glowupbeautysolutions\.com\/?$/i.test(current) && !current.includes('/book/'))
  if (looksUnset) saveSalonContext({ externalBookingUrl: url })
  return url
}

type MergeRecord = { id?: string; updatedAt?: string; createdAt?: string }

function recordTs(item: MergeRecord): number {
  const value = item.updatedAt || item.createdAt || ''
  if (!value) return 0
  const n = Date.parse(value)
  return Number.isFinite(n) ? n : 0
}

/** Union by id. Same id → later updatedAt/createdAt wins. Cloud-only rows are kept. */
function mergeById(local: unknown, remote: unknown): unknown[] {
  const loc = Array.isArray(local) ? (local as MergeRecord[]) : []
  const rem = Array.isArray(remote) ? (remote as MergeRecord[]) : []
  const map = new Map<string, MergeRecord>()
  for (const item of rem) {
    if (item && typeof item === 'object' && typeof item.id === 'string' && item.id) {
      map.set(item.id, item)
    }
  }
  for (const item of loc) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) continue
    const existing = map.get(item.id)
    if (!existing || recordTs(item) >= recordTs(existing)) {
      map.set(item.id, item)
    }
  }
  return Array.from(map.values())
}

export function buildSnapshot(): OpsSnapshot {
  const settings = loadOpsSettings()
  const key = ensureSalonSyncKey()
  const deskKey = ensureDeskKey()
  const idMeta = getCloudIdentityMeta()
  return {
    version: 1,
    salonSyncKey: key,
    deskKey,
    updatedAt: new Date().toISOString(),
    ownerIdentityId: idMeta.identityUserId,
    ownerEmail: idMeta.email,
    appointments: listAppointments(true),
    clients: listClients(),
    notifications: listMessages(200),
    settings: {
      stripePaymentLink: settings.stripePaymentLink,
      depositAmount: settings.depositAmount,
      depositCurrency: settings.depositCurrency,
      ownerNotifyEmail: settings.ownerNotifyEmail,
      ownerNotifyPhone: settings.ownerNotifyPhone,
      studioName: settings.studioName,
      hours: settings.hours,
      services: settings.services,
      city: settings.city,
      messagingEnabled: settings.messagingEnabled,
      salonSyncKey: key,
      deskKey,
      syncEnabled: settings.syncEnabled,
      ownerIdentityId: idMeta.identityUserId,
      ownerEmail: idMeta.email,
    },
  }
}

export function applySnapshot(snap: OpsSnapshot, mode: 'merge' | 'replace' = 'replace') {
  if (!canUse()) return
  if (mode === 'replace') {
    if (Array.isArray(snap.appointments)) {
      window.localStorage.setItem(APPT_KEY, JSON.stringify(snap.appointments))
    }
    if (Array.isArray(snap.clients)) {
      window.localStorage.setItem(CLIENT_KEY, JSON.stringify(snap.clients))
    }
    if (Array.isArray(snap.notifications)) {
      replaceAllMessages(snap.notifications)
    }
  }
  if (snap.settings) {
    saveOpsSettings({
      ...snap.settings,
      salonSyncKey: snap.salonSyncKey || snap.settings.salonSyncKey,
      deskKey: snap.deskKey || snap.settings.deskKey || loadOpsSettings().deskKey,
      lastSyncedAt: snap.updatedAt || new Date().toISOString(),
      syncEnabled: true,
    })
  } else {
    saveOpsSettings({ lastSyncedAt: new Date().toISOString(), syncEnabled: true })
  }
  purgeDemoAppointmentsIfOnboarded()
}

export function exportSnapshotFile() {
  const snap = buildSnapshot()
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `glowup-salon-${snap.salonSyncKey.slice(0, 8)}.json`
  a.click()
  URL.revokeObjectURL(url)
  return snap
}

export async function importSnapshotFile(file: File) {
  const text = await file.text()
  const snap = JSON.parse(text) as OpsSnapshot
  if (!snap || snap.version !== 1) throw new Error('Invalid GlowUP snapshot file')
  applySnapshot(snap, 'replace')
  return snap
}

export type SyncResult =
  | { ok: true; mode: 'push' | 'pull'; updatedAt: string; source: 'api' | 'local' }
  | { ok: false; error: string; needsApi?: boolean }

/** Prefer path rewrite; fall back to direct Netlify function (avoids SPA catch-all). */
const OPS_ENDPOINTS = ['/api/ops', '/.netlify/functions/ops'] as const

function looksLikeHtml(text: string) {
  return /<!DOCTYPE|<html[\s>]/i.test(text.slice(0, 200))
}

/** SPA shell or missing function — try next endpoint. Not "salon not found" JSON. */
function isSpaOrMissingFunction(status: number, bodyText: string) {
  if (looksLikeHtml(bodyText)) return true
  if (status === 404 && !bodyText.trim()) return true
  if (status === 404 && /page not found/i.test(bodyText) && !/salon not found/i.test(bodyText)) return true
  return false
}

type OpsHttp = { status: number; text: string; endpoint: string }

async function opsGet(query: Record<string, string>): Promise<OpsHttp> {
  let last: OpsHttp = { status: 0, text: 'No endpoint reached', endpoint: '' }
  const qs = new URLSearchParams(query).toString()
  for (const endpoint of OPS_ENDPOINTS) {
    try {
      const headers: Record<string, string> = {}
      const admin = loadOpsSettings().salonSyncKey
      if (admin && query.key === admin) headers.Authorization = `Bearer ${admin}`
      const res = await fetch(`${endpoint}?${qs}`, { method: 'GET', cache: 'no-store', headers })
      const text = await res.text()
      last = { status: res.status, text, endpoint }
      if (isSpaOrMissingFunction(res.status, text) && endpoint === OPS_ENDPOINTS[0]) {
        continue
      }
      return last
    } catch (e) {
      last = {
        status: 0,
        text: e instanceof Error ? e.message : 'Network error',
        endpoint,
      }
    }
  }
  return last
}

async function opsRequest(method: 'GET' | 'PUT', keyOrBody: string | object): Promise<OpsHttp> {
  if (method === 'GET') {
    return opsGet({ key: String(keyOrBody) })
  }
  let last: OpsHttp = { status: 0, text: 'No endpoint reached', endpoint: '' }
  for (const endpoint of OPS_ENDPOINTS) {
    try {
      const admin = loadOpsSettings().salonSyncKey
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (admin) headers.Authorization = `Bearer ${admin}`
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(keyOrBody),
        cache: 'no-store',
      })
      const text = await res.text()
      last = { status: res.status, text, endpoint }
      // Wrong route (HTML app shell) → try direct function path
      if (isSpaOrMissingFunction(res.status, text) && endpoint === OPS_ENDPOINTS[0]) {
        continue
      }
      return last
    } catch (e) {
      last = {
        status: 0,
        text: e instanceof Error ? e.message : 'Network error',
        endpoint,
      }
    }
  }
  return last
}

/** Quick probe used by Ops UI */
export async function probeOpsApi(): Promise<{ ok: boolean; detail: string }> {
  try {
    const health = await fetch('/api/health', { cache: 'no-store' })
    const hj = health.ok ? ((await health.json()) as { ops?: string; ok?: boolean }) : null
    if (health.ok && hj) {
      return { ok: true, detail: `Cloud book online${hj.ops ? ` · health.ops=${hj.ops}` : ''}` }
    }
    return { ok: false, detail: `Health HTTP ${health.status}` }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'Probe failed' }
  }
}

/** Recover salon key from owner email / identity (second device after sign-in). */
export async function lookupSalonByOwner(input: {
  email?: string
  identity?: string
}): Promise<string | null> {
  const email = (input.email || '').trim().toLowerCase()
  const identity = (input.identity || '').trim()
  const query: Record<string, string> = {}
  if (email) query.email = email
  else if (identity) query.identity = identity
  else return null
  try {
    const { status, text } = await opsGet(query)
    if (status < 200 || status >= 300 || looksLikeHtml(text)) return null
    const data = JSON.parse(text) as { salonSyncKey?: string }
    const key = String(data.salonSyncKey || '').trim()
    return key.length >= 8 ? key : null
  } catch {
    return null
  }
}

/**
 * Device B: adopt the cloud salon for this signed-in owner if this device
 * has not published a book yet. Device A (already synced) keeps its key.
 */
export async function resolveCloudSalon(): Promise<string> {
  const local = loadOpsSettings()
  if (local.salonSyncKey && local.lastSyncedAt) {
    return local.salonSyncKey
  }
  const meta = getCloudIdentityMeta()
  const email = meta.email || local.ownerNotifyEmail || ''
  const identity = meta.identityUserId || ''
  const found =
    (email ? await lookupSalonByOwner({ email }) : null) ||
    (identity ? await lookupSalonByOwner({ identity }) : null)
  if (found) {
    saveOpsSettings({ salonSyncKey: found, syncEnabled: true })
    return found
  }
  return ensureSalonSyncKey()
}

/** Push local book to cloud API (if function is deployed). Merges with existing snap first. */
export async function pushToCloud(): Promise<SyncResult> {
  const local = buildSnapshot()
  try {
    const existing = await opsRequest('GET', local.salonSyncKey)
    let snap = local
    if (existing.status >= 200 && existing.status < 300 && !looksLikeHtml(existing.text)) {
      try {
        const remote = JSON.parse(existing.text) as OpsSnapshot
        const appointments = mergeById(local.appointments, remote.appointments)
        const clients = mergeById(local.clients, remote.clients)
        const notifications = mergeById(local.notifications, remote.notifications) as OpsSnapshot['notifications']
        snap = { ...local, appointments, clients, notifications }
        if (canUse()) {
          window.localStorage.setItem(APPT_KEY, JSON.stringify(appointments))
          window.localStorage.setItem(CLIENT_KEY, JSON.stringify(clients))
          replaceAllMessages(notifications)
          purgeDemoAppointmentsIfOnboarded()
        }
      } catch {
        /* invalid remote — push local as-is */
      }
    }

    const { status, text, endpoint } = await opsRequest('PUT', snap)

    if (status >= 200 && status < 300 && !looksLikeHtml(text)) {
      let data: { updatedAt?: string; deskKey?: string } = {}
      try {
        data = JSON.parse(text) as { updatedAt?: string; deskKey?: string }
      } catch {
        /* still ok if empty body */
      }
      const updatedAt = data.updatedAt || snap.updatedAt
      saveOpsSettings({
        lastSyncedAt: updatedAt,
        syncEnabled: true,
        ...(data.deskKey ? { deskKey: data.deskKey } : {}),
      })
      return { ok: true, mode: 'push', updatedAt, source: 'api' }
    }

    if (isSpaOrMissingFunction(status, text) || status === 0) {
      return {
        ok: false,
        error: `Could not reach cloud book (HTTP ${status} @ ${endpoint || 'ops'}). Hard-refresh (Ctrl+F5), then try Push again. Export still works offline.`,
        needsApi: true,
      }
    }

    return {
      ok: false,
      error: `Push failed (HTTP ${status}): ${text.slice(0, 180) || 'unknown'}`,
      needsApi: false,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
      needsApi: true,
    }
  }
}

/** Pull salon book from cloud by key */
export async function pullFromCloud(key?: string): Promise<SyncResult> {
  const salonKey = key || ensureSalonSyncKey()
  try {
    const { status, text, endpoint } = await opsRequest('GET', salonKey)

    if (status >= 200 && status < 300 && !looksLikeHtml(text)) {
      let snap: OpsSnapshot
      try {
        snap = JSON.parse(text) as OpsSnapshot
      } catch {
        return { ok: false, error: 'Cloud returned invalid data.', needsApi: false }
      }
      if (!Array.isArray(snap.appointments) && !Array.isArray(snap.clients)) {
        return { ok: false, error: 'Empty cloud salon — push from primary device first.' }
      }
      const local = buildSnapshot()
      const appointments = mergeById(local.appointments, snap.appointments)
      const clients = mergeById(local.clients, snap.clients)
      const notifications = mergeById(local.notifications, snap.notifications) as OpsSnapshot['notifications']
      applySnapshot({ ...snap, appointments, clients, notifications }, 'replace')
      return { ok: true, mode: 'pull', updatedAt: snap.updatedAt, source: 'api' }
    }

    // Empty salon book (never pushed) — API is live
    if (status === 404 && !looksLikeHtml(text) && /salon not found/i.test(text)) {
      return {
        ok: false,
        error: 'No cloud book for this key yet — click “Push to cloud” on this device first.',
        needsApi: false,
      }
    }

    if (isSpaOrMissingFunction(status, text) || status === 0) {
      return {
        ok: false,
        error: `Could not reach cloud book (HTTP ${status} @ ${endpoint || 'ops'}). Hard-refresh (Ctrl+F5), then Push first.`,
        needsApi: true,
      }
    }

    return { ok: false, error: text.slice(0, 180) || `HTTP ${status}` }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
      needsApi: true,
    }
  }
}
