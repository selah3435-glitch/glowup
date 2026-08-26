/**
 * Company hunt — same contract as netlify/functions/company-prospect.ts
 * for deploy:full (functions-clean).
 */
import { runCompanyProspectSearch } from '../../src/lib/company-prospect.ts'

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'POST only' }) }
  }
  let city = ''
  let salonKey = ''
  try {
    const parsed = JSON.parse(event.body || '{}')
    city = String(parsed.city || '')
    salonKey = String(parsed.salonKey || '').trim()
  } catch {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid JSON' }) }
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
    return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'salonKey or admin token required' }) }
  }
  const result = await runCompanyProspectSearch(city)
  return { statusCode: 200, headers: cors(), body: JSON.stringify(result) }
}
