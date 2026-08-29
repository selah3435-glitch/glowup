/**
 * Platform signup registry + funnel events.
 * POST /api/platform  { event, email, name?, identityUserId?, stage?, meta? }
 * GET  /api/platform  Authorization: Bearer <PLATFORM_ADMIN_TOKEN> OR ?key=
 *
 * Storage: Netlify Blobs (glowup-platform) with in-memory fallback.
 * Alerts: OPS_ALERT_WEBHOOK (POST JSON) on signed_up / onboarding_complete.
 */

const STORE = 'glowup-platform'
const KEY = 'signups_v1'

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

async function getStore() {
  try {
    const { getStore } = await import('@netlify/blobs')
    return getStore(STORE)
  } catch {
    return null
  }
}

/** @type {Map<string, object>} */
const memory = globalThis.__glowupSignups || (globalThis.__glowupSignups = new Map())

async function loadAll() {
  const store = await getStore()
  if (store) {
    try {
      const raw = await store.get(KEY, { type: 'json' })
      if (Array.isArray(raw)) return raw
      if (raw?.items && Array.isArray(raw.items)) return raw.items
    } catch {
      /* empty */
    }
  }
  return Array.from(memory.values())
}

async function saveAll(items) {
  const store = await getStore()
  if (store) {
    await store.setJSON(KEY, { items, updatedAt: new Date().toISOString() })
  }
  memory.clear()
  for (const it of items) memory.set(it.id, it)
}

function isAdmin(event) {
  const token = process.env.PLATFORM_ADMIN_TOKEN || ''
  if (!token) return false
  const auth = event.headers.authorization || event.headers.Authorization || ''
  const bearer = auth.replace(/^Bearer\s+/i, '').trim()
  return Boolean(bearer && bearer === token)
}

async function notify(payload) {
  const url = process.env.OPS_ALERT_WEBHOOK
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'glowup-platform',
        ...payload,
        at: new Date().toISOString(),
      }),
    })
  } catch {
    /* never fail request on alert */
  }
}

async function emailFounder({ subject, text }) {
  const to = (
    process.env.FOUNDER_NOTIFY_EMAIL ||
    process.env.RESEND_REPLY_TO ||
    'aaron.jawsai@gmail.com'
  )
    .trim()
    .toLowerCase()
  if (!to.includes('@')) return
  try {
    const { sendResendEmail } = await import('./_lib/send-resend.mjs')
    await sendResendEmail({ to, subject, text, replyTo: to })
  } catch {
    /* never fail request on alert */
  }
}

function stageRank(s) {
  const order = ['signed_up', 'onboarding_started', 'onboarding_complete', 'active']
  const i = order.indexOf(s)
  return i < 0 ? 0 : i
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }

  if (event.httpMethod === 'GET') {
    if (!isAdmin(event)) return json(401, { error: 'Unauthorized' })
    const items = await loadAll()
    items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    return json(200, {
      count: items.length,
      items,
      stages: {
        signed_up: items.filter((i) => i.stage === 'signed_up').length,
        onboarding_started: items.filter((i) => i.stage === 'onboarding_started').length,
        onboarding_complete: items.filter((i) => i.stage === 'onboarding_complete').length,
        active: items.filter((i) => i.stage === 'active').length,
      },
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

  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  if (!email || !email.includes('@')) {
    return json(400, { error: 'Valid email required' })
  }

  const stage = body.stage || (body.event === 'signup' ? 'signed_up' : body.event) || 'signed_up'
  const allowed = new Set(['signed_up', 'onboarding_started', 'onboarding_complete', 'active'])
  if (!allowed.has(stage)) {
    return json(400, { error: 'Invalid stage' })
  }

  const now = new Date().toISOString()
  const items = await loadAll()
  let row = items.find((i) => i.email === email)
  const prevStage = row?.stage

  if (!row) {
    row = {
      id: `su_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      name: String(body.name || '').trim(),
      identityUserId: body.identityUserId || '',
      stage,
      createdAt: now,
      updatedAt: now,
      meta: body.meta || {},
    }
    items.push(row)
  } else {
    // Only advance stage forward
    if (stageRank(stage) >= stageRank(row.stage)) {
      row.stage = stage
    }
    if (body.name) row.name = String(body.name).trim()
    if (body.identityUserId) row.identityUserId = body.identityUserId
    if (body.meta && typeof body.meta === 'object') {
      row.meta = { ...(row.meta || {}), ...body.meta }
    }
    row.updatedAt = now
  }

  await saveAll(items)

  const meta = row.meta && typeof row.meta === 'object' ? row.meta : {}
  const isGap = meta.source === 'gap_audit'

  if (stage === 'signed_up' && !prevStage) {
    await notify({
      type: isGap ? 'gap_audit' : 'signup',
      title: isGap ? 'GlowUP gap audit' : 'New GlowUP signup',
      email: row.email,
      name: row.name,
      stage: row.stage,
      chairs: meta.chairs,
      missedWeekly: meta.missedWeekly,
    })
    await emailFounder({
      subject: isGap ? `Gap audit: ${row.email}` : `New signup: ${row.email}`,
      text: [
        isGap ? 'New gap audit on glowupbeautysolutions.com' : 'New signup on glowupbeautysolutions.com',
        `Email: ${row.email}`,
        row.name ? `Name: ${row.name}` : '',
        meta.chairs ? `Chairs: ${meta.chairs}` : '',
        meta.missedWeekly ? `Missed / after-hours per week (est.): ${meta.missedWeekly}` : '',
        `Stage: ${row.stage}`,
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } else if (isGap && prevStage) {
    await emailFounder({
      subject: `Gap audit: ${row.email}`,
      text: [
        'Gap audit (existing signup) on glowupbeautysolutions.com',
        `Email: ${row.email}`,
        meta.chairs ? `Chairs: ${meta.chairs}` : '',
        meta.missedWeekly ? `Missed / after-hours per week (est.): ${meta.missedWeekly}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } else if (stage === 'onboarding_complete' && prevStage !== 'onboarding_complete' && prevStage !== 'active') {
    await notify({
      type: 'onboarding_complete',
      title: 'Salon onboarding complete',
      email: row.email,
      name: row.name,
      stage: row.stage,
      salon: body.meta?.salonName,
    })
    await emailFounder({
      subject: `Onboarding complete: ${row.email}`,
      text: [
        'Salon onboarding complete',
        `Email: ${row.email}`,
        row.name ? `Name: ${row.name}` : '',
        body.meta?.salonName ? `Salon: ${body.meta.salonName}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  }

  return json(200, { ok: true, item: row })
}
