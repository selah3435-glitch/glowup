/**
 * Glo website chat — server-side xAI (API key never in browser).
 * POST /api/glo/chat  { messages, mode?, salonName?, hours?, services?, salonKey? }
 * Returns { reply, actions[] } for client to run against calendar / /api/glo/desk.
 */
import type { Config } from '@netlify/functions'

function buildSystem(input: {
  salonName?: string
  hours?: string
  services?: string[] | string
  salonKey?: string
}) {
  const services = Array.isArray(input.services)
    ? input.services.map((s) => String(s).trim()).filter(Boolean).join(', ')
    : String(input.services || '').trim()
  const hasStudio = Boolean(input.salonName || input.hours || services || input.salonKey)
  const facts = hasStudio
    ? `This chat is for studio: ${input.salonName || 'this studio'}.
Hours: ${input.hours || 'not published'}.
Services (only these — do not invent others or prices): ${services || 'not published'}.
If a price is not written in Services, do not quote one.`
    : `This is the company GlowUP marketing desk, not a salon floor. Chat here to show how Glo books. Salon clients use the studio's own Glo link. Phone voice is not live yet. Do not invent salon prices.`

  return `You are Glo, the GlowUP. salon AI (website chat). Brand: GlowUP. — Beauty Business, Beautifully Done.

${facts}

You do three jobs:
1) LEAD CAPTURE — interest, service, name, phone, optional email
2) BOOKING — service, day, time, name, phone then confirm
3) SUPPORT — hours, pricing, FAQs from the provided studio facts only

Be warm, concise, professional. Never invent medical claims.
Do not invent prices. Only mention a price if it appears in the provided services text.
Do not promise a live phone or voice desk. Chat books the desk. Voice is coming soon.

When you have enough info to save a lead or book, ALSO append a single JSON line the client can parse:
ACTIONS:[{"type":"capture_lead","name":"...","phone":"...","email":"","serviceInterest":"...","interest":"...","fit":"hot|warm|nurture"}]
or
ACTIONS:[{"type":"book","service":"...","dateISO":"YYYY-MM-DD","time":"10:00 AM","clientName":"...","clientPhone":"..."}]
or
ACTIONS:[{"type":"none"}]

Use weekday times like "10:00 AM". Prefer real next weekdays. dateISO must be YYYY-MM-DD.
If missing phone/name, ask — do not emit ACTIONS until complete.
Keep the spoken reply natural; put ACTIONS only on the last line.`
}

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string }

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: cors(),
    })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405, headers: cors() })
  }

  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error: 'XAI_API_KEY not configured on server',
        fallback: true,
        reply:
          "I'm Glo (offline AI mode). I can still capture a lead or book with the chips. Phone voice is not live yet.",
      },
      { status: 200, headers: cors() },
    )
  }

  let body: {
    messages?: ChatMsg[]
    mode?: string
    salonName?: string
    hours?: string
    services?: string[] | string
    salonKey?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors() })
  }

  const history = (body.messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-16)

  if (!history.length) {
    return Response.json({ error: 'messages required' }, { status: 400, headers: cors() })
  }

  const modeHint =
    body.mode === 'lead'
      ? 'User wants lead capture / more info.'
      : body.mode === 'book'
        ? 'User wants to book an appointment.'
        : 'Route naturally between lead, book, and support.'

  const system = buildSystem({
    salonName: body.salonName,
    hours: body.hours,
    services: body.services,
    salonKey: body.salonKey,
  })

  const model = process.env.XAI_CHAT_MODEL || 'grok-3-latest'

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        messages: [
          { role: 'system', content: system + '\n' + modeHint },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return Response.json(
        {
          error: `xAI error ${res.status}`,
          detail: errText.slice(0, 400),
          fallback: true,
          reply:
            "I'm having trouble reaching my AI brain. Use the chips to leave a lead or book. Phone voice is not live yet.",
        },
        { status: 200, headers: cors() },
      )
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const full = data.choices?.[0]?.message?.content?.trim() || ''
    const { reply, actions } = splitActions(full)

    return Response.json(
      {
        reply: reply || "I'm here — want to book or leave your number for a callback?",
        actions,
        model,
      },
      { headers: cors() },
    )
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : 'chat failed',
        fallback: true,
        reply: 'Connection blip. Try the chips to book or leave a lead. Phone voice is not live yet.',
      },
      { status: 200, headers: cors() },
    )
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function splitActions(full: string): { reply: string; actions: unknown[] } {
  const lines = full.split('\n')
  let actions: unknown[] = []
  const kept: string[] = []
  for (const line of lines) {
    const m = line.match(/^\s*ACTIONS:\s*(\[.*\])\s*$/i)
    if (m) {
      try {
        actions = JSON.parse(m[1]) as unknown[]
      } catch {
        actions = []
      }
    } else {
      kept.push(line)
    }
  }
  return { reply: kept.join('\n').trim(), actions }
}

export const config: Config = { path: '/api/glo/chat' }
