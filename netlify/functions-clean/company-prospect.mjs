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
  try {
    city = String(JSON.parse(event.body || '{}').city || '')
  } catch {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid JSON' }) }
  }
  const result = await runCompanyProspectSearch(city)
  return { statusCode: 200, headers: cors(), body: JSON.stringify(result) }
}
