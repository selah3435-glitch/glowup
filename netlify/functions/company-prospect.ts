import type { Config } from '@netlify/functions'
import { runCompanyProspectSearch } from '../../src/lib/company-prospect'

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() })
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405, headers: cors() })
  }
  let city = ''
  try {
    const body = (await request.json()) as { city?: string }
    city = String(body.city || '')
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors() })
  }
  const result = await runCompanyProspectSearch(city)
  return Response.json(result, { headers: cors() })
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

export const config: Config = { path: '/api/agents/company-prospect' }
