/**
 * Competitor Scout hunt — nearby Google Places + public $ on competitor sites.
 */
import { runCompetitorHunt } from '../../src/lib/competitor-hunt.ts'

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function payload(city, extra = {}) {
  return {
    city: city || '',
    competitors: [],
    note: '',
    ...extra,
  }
}

export async function handler(event) {
  const method = event.httpMethod || event.method || ''
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: cors(),
      body: JSON.stringify(payload('', { error: 'POST only' })),
    }
  }
  let city = ''
  let ownName = ''
  let salonKey = ''
  try {
    const parsed = JSON.parse(event.body || '{}')
    city = String(parsed.city || '')
    ownName = String(parsed.ownName || '')
    salonKey = String(parsed.salonKey || '').trim()
  } catch {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify(payload('', { error: 'Invalid JSON' })),
    }
  }
  const admin = process.env.PLATFORM_ADMIN_TOKEN || ''
  const auth = event.headers.authorization || event.headers.Authorization || ''
  const bearer = String(auth).replace(/^Bearer\s+/i, '').trim()
  let allowed = Boolean(admin && bearer === admin)
  if (!allowed && salonKey && !salonKey.startsWith('gd_')) {
    const { loadOpsSnap } = await import('./_lib/send-resend.mjs')
    allowed = Boolean(await loadOpsSnap(salonKey))
  }
  if (!allowed) {
    return {
      statusCode: 401,
      headers: cors(),
      body: JSON.stringify(payload(city, { error: 'salonKey or admin token required' })),
    }
  }
  try {
    const result = await runCompetitorHunt({ city, ownName })
    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        city: result.city || city,
        competitors: result.competitors || [],
        note: result.note || '',
        error: result.error,
      }),
    }
  } catch (e) {
    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify(
        payload(city, {
          error: e instanceof Error ? e.message : 'Competitor hunt failed',
        }),
      ),
    }
  }
}
