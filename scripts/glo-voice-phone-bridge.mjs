/**
 * Glo voice phone bridge — xAI Realtime + SIP/phone number
 *
 * When someone dials Glo's number, xAI posts realtime.call.incoming
 * to your webhook. This server:
 *   1) verifies the webhook (if XAI_WEBHOOK_SECRET is set)
 *   2) opens wss://api.x.ai/v1/realtime?call_id=...&agent_id=...
 *   3) streams the call with your Console agent (Glo)
 *   4) optionally forwards tool calls to local MCP façade later
 *
 * Required env:
 *   XAI_API_KEY
 * Optional:
 *   XAI_AGENT_ID          default 00929ede-1eb1-4a74-9221-dd69617071f9
 *   GLO_PHONE_E164        default +19714761615
 *   XAI_WEBHOOK_SECRET    signing secret from number registration
 *   PORT                  default 8787
 *   PUBLIC_BASE_URL       e.g. https://your-tunnel.example.com
 *
 * Run:
 *   $env:XAI_API_KEY="xai-..."
 *   npm run glo:phone
 *
 * Console setup (required once):
 *   1. xAI Console → Voice Agents → open agent 00929ede-...
 *   2. Attach phone +19714761615 to this agent
 *   3. Set webhook URL to {PUBLIC_BASE_URL}/webhooks/xai/realtime
 *   4. Save signing secret as XAI_WEBHOOK_SECRET
 */

import http from 'http'
import crypto from 'crypto'
import WebSocket from 'ws'

const API_KEY = process.env.XAI_API_KEY
const AGENT_ID = process.env.XAI_AGENT_ID || '00929ede-1eb1-4a74-9221-dd69617071f9'
const GLO_PHONE = process.env.GLO_PHONE_E164 || '+19714761615'
const WEBHOOK_SECRET = process.env.XAI_WEBHOOK_SECRET || ''
const PORT = Number(process.env.PORT || 8787)

if (!API_KEY) {
  console.error('Missing XAI_API_KEY')
  process.exit(1)
}

/** @type {Map<string, WebSocket>} */
const activeCalls = new Map()

function verifyWebhook(headers, rawBody) {
  if (!WEBHOOK_SECRET) return { ok: true, skipped: true }
  const id = headers['webhook-id'] || headers['Webhook-Id']
  const ts = headers['webhook-timestamp'] || headers['Webhook-Timestamp']
  const sig = headers['webhook-signature'] || headers['Webhook-Signature']
  if (!id || !ts || !sig) return { ok: false, error: 'missing webhook signature headers' }

  // Standard signed webhook: "{id}.{timestamp}.{body}"
  const payload = `${id}.${ts}.${rawBody}`
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('base64')
  const parts = String(sig)
    .split(' ')
    .map((p) => p.replace(/^v1,/, '').replace(/^v1=/, ''))
  const match = parts.some((p) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(p), Buffer.from(expected))
    } catch {
      return p === expected
    }
  })
  if (!match) return { ok: false, error: 'invalid webhook signature' }
  return { ok: true }
}

function acceptCall(callId, from, to) {
  if (activeCalls.has(callId)) {
    console.log('call already active', callId)
    return
  }

  const url =
    `wss://api.x.ai/v1/realtime?call_id=${encodeURIComponent(callId)}` +
    `&agent_id=${encodeURIComponent(AGENT_ID)}`

  console.log('accepting call', { callId, from, to, agent: AGENT_ID })

  const ws = new WebSocket(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  })

  activeCalls.set(callId, ws)

  ws.on('open', () => {
    console.log('realtime open for call', callId)
    // Optional nudge so Glo greets immediately on connect
    try {
      ws.send(
        JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ['audio', 'text'],
            instructions:
              'You are Glo, GlowUP. AI receptionist. Greet the caller warmly, offer to book, take a lead, or answer a quick question. Keep it concise.',
          },
        }),
      )
    } catch {
      /* ignore */
    }
  })

  ws.on('message', (raw) => {
    let event
    try {
      event = JSON.parse(raw.toString())
    } catch {
      return
    }
    const t = event.type
    if (t === 'response.output_audio_transcript.delta') {
      process.stdout.write(event.delta || '')
      return
    }
    if (t === 'response.output_audio_transcript.done') {
      process.stdout.write('\n')
      return
    }
    if (t === 'error' || event.error) {
      console.error('call error', callId, JSON.stringify(event))
      return
    }
    if (t === 'session.created' || t === 'session.updated') {
      console.log('←', t, callId)
    }
    // Future: function_call events → mcp-booking-crm / leads-store via HTTP
  })

  ws.on('close', (code) => {
    console.log('call closed', callId, code)
    activeCalls.delete(callId)
  })

  ws.on('error', (err) => {
    console.error('call ws error', callId, err.message)
    activeCalls.delete(callId)
  })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        service: 'glo-voice-phone-bridge',
        phone: GLO_PHONE,
        agent_id: AGENT_ID,
        active_calls: activeCalls.size,
      }),
    )
    return
  }

  if (req.method === 'POST' && url.pathname === '/webhooks/xai/realtime') {
    const raw = await readBody(req)
    const verify = verifyWebhook(req.headers, raw)
    if (!verify.ok) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: verify.error }))
      return
    }

    let body
    try {
      body = JSON.parse(raw || '{}')
    } catch {
      res.writeHead(400)
      res.end('bad json')
      return
    }

    console.log('webhook', body.type, body.id || '')

    if (body.type === 'realtime.call.incoming') {
      const callId = body.data?.call_id
      const headers = body.data?.sip_headers || []
      const from = headers.find((h) => /from/i.test(h.name))?.value || ''
      const to = headers.find((h) => /to/i.test(h.name))?.value || GLO_PHONE
      if (callId) acceptCall(callId, from, to)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, accepted: Boolean(callId) }))
      return
    }

    // Acknowledge other events
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, ignored: body.type || 'unknown' }))
    return
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log(`Glo phone bridge listening on :${PORT}`)
  console.log(`  phone   ${GLO_PHONE}`)
  console.log(`  agent   ${AGENT_ID}`)
  console.log(`  webhook POST /webhooks/xai/realtime`)
  console.log(`  health  GET  /health`)
  if (!WEBHOOK_SECRET) console.log('  warn    XAI_WEBHOOK_SECRET not set (signature check skipped)')
  if (!process.env.PUBLIC_BASE_URL) {
    console.log('  next    Expose this host (ngrok/cloudflared) and set webhook in xAI Console')
  } else {
    console.log(`  public  ${process.env.PUBLIC_BASE_URL}/webhooks/xai/realtime`)
  }
})
