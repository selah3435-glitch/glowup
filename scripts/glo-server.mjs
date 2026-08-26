/**
 * Unified Glo server: phone bridge + website chat API
 *
 *   $env:XAI_API_KEY="xai-..."
 *   $env:PORT=8787
 *   npm run glo:server
 *
 * Endpoints:
 *   GET  /health
 *   POST /api/glo/chat
 *   POST /webhooks/xai/realtime   (phone inbound)
 */

import http from 'http'
import crypto from 'crypto'
import WebSocket from 'ws'

const API_KEY = process.env.XAI_API_KEY
const AGENT_ID = process.env.XAI_AGENT_ID || '00929ede-1eb1-4a74-9221-dd69617071f9'
const GLO_PHONE = process.env.GLO_PHONE_E164 || '+19714761615'
const WEBHOOK_SECRET = process.env.XAI_WEBHOOK_SECRET || ''
const PORT = Number(process.env.PORT || 8787)
const MODEL = process.env.XAI_CHAT_MODEL || 'grok-3-latest'

const SYSTEM = `You are Glo, the GlowUP. salon AI. Phone: +1 (971) 476-1615.
Capture leads and book appointments. Warm, short, professional.
When lead or booking is complete, end with a line:
ACTIONS:[{"type":"capture_lead",...}] or ACTIONS:[{"type":"book",...}] or ACTIONS:[{"type":"none"}]`

const activeCalls = new Map()

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function splitActions(full) {
  const lines = full.split('\n')
  let actions = []
  const kept = []
  for (const line of lines) {
    const m = line.match(/^\s*ACTIONS:\s*(\[.*\])\s*$/i)
    if (m) {
      try {
        actions = JSON.parse(m[1])
      } catch {
        actions = []
      }
    } else kept.push(line)
  }
  return { reply: kept.join('\n').trim(), actions }
}

async function chatCompletions(messages, mode) {
  if (!API_KEY) {
    return {
      reply:
        "I'm Glo (AI key not set on server). Use chips or call +1 (971) 476-1615.",
      actions: [],
      fallback: true,
    }
  }
  const modeHint =
    mode === 'lead'
      ? 'Focus on lead capture.'
      : mode === 'book'
        ? 'Focus on booking.'
        : 'Lead, book, or support as needed.'

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM + '\n' + modeHint }, ...messages],
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`xAI ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = await res.json()
  const full = data.choices?.[0]?.message?.content?.trim() || ''
  return { ...splitActions(full), model: MODEL, agent_id: AGENT_ID }
}

function acceptCall(callId, from, to) {
  if (activeCalls.has(callId)) return
  const url = `wss://api.x.ai/v1/realtime?call_id=${encodeURIComponent(callId)}&agent_id=${encodeURIComponent(AGENT_ID)}`
  console.log('accept call', { callId, from, to })
  const ws = new WebSocket(url, {
    headers: { Authorization: `Bearer ${API_KEY}`, 'OpenAI-Beta': 'realtime=v1' },
  })
  activeCalls.set(callId, ws)
  ws.on('open', () => {
    ws.send(
      JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
          instructions:
            'You are Glo for GlowUP. Greet warmly. Offer to book, take a lead, or answer a question. Keep it short.',
        },
      }),
    )
  })
  ws.on('message', (raw) => {
    try {
      const event = JSON.parse(raw.toString())
      if (event.type === 'response.output_audio_transcript.delta') process.stdout.write(event.delta || '')
      if (event.type === 'error') console.error('call err', event)
    } catch {
      /* ignore */
    }
  })
  ws.on('close', () => activeCalls.delete(callId))
  ws.on('error', () => activeCalls.delete(callId))
}

const server = http.createServer(async (req, res) => {
  cors(res)
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        phone: GLO_PHONE,
        agent_id: AGENT_ID,
        chat: true,
        phone_bridge: true,
        active_calls: activeCalls.size,
        has_key: Boolean(API_KEY),
      }),
    )
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/glo/chat') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}')
      const history = (body.messages || [])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
        .slice(-16)
      const out = await chatCompletions(history, body.mode || 'auto')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(out))
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          fallback: true,
          reply: e instanceof Error ? e.message : 'chat failed',
          actions: [],
        }),
      )
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/webhooks/xai/realtime') {
    const raw = await readBody(req)
    if (WEBHOOK_SECRET) {
      const id = req.headers['webhook-id']
      const ts = req.headers['webhook-timestamp']
      const sig = String(req.headers['webhook-signature'] || '')
      const payload = `${id}.${ts}.${raw}`
      const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('base64')
      const ok = sig.split(' ').some((p) => p.replace(/^v1,/, '') === expected)
      if (!ok) {
        res.writeHead(401)
        res.end('bad signature')
        return
      }
    }
    let body = {}
    try {
      body = JSON.parse(raw || '{}')
    } catch {
      /* ignore */
    }
    if (body.type === 'realtime.call.incoming' && body.data?.call_id) {
      const headers = body.data.sip_headers || []
      const from = headers.find((h) => /from/i.test(h.name))?.value || ''
      const to = headers.find((h) => /to/i.test(h.name))?.value || GLO_PHONE
      acceptCall(body.data.call_id, from, to)
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log(`Glo unified server :${PORT}`)
  console.log(`  chat   POST /api/glo/chat`)
  console.log(`  phone  POST /webhooks/xai/realtime`)
  console.log(`  phone# ${GLO_PHONE}`)
  console.log(`  agent  ${AGENT_ID}`)
  console.log(`  key    ${API_KEY ? 'set' : 'MISSING'}`)
})
