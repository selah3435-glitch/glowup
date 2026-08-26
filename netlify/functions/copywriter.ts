/**
 * POST /api/agents/copywriter
 * Glow Agents Copywriter — salon SMS / email / social packs via xAI.
 */
import type { Config } from '@netlify/functions'
import type { CopywriterRequest } from '../../src/agents/copywriter'
import { runCopywriterRequest } from '../../src/agents/run-copywriter'

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() })
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405, headers: cors() })
  }

  let body: CopywriterRequest
  try {
    body = (await request.json()) as CopywriterRequest
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors() })
  }

  const result = await runCopywriterRequest(body)
  return Response.json(result, { headers: cors() })
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

export const config: Config = { path: '/api/agents/copywriter' }
