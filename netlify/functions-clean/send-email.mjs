/**
 * POST /api/email
 * { to, subject, body, kind? }
 * Sends via Resend when RESEND_API_KEY (+ optional RESEND_FROM) set.
 * Otherwise { ok:false, fallback:'mailto' }.
 */

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function json(status, body) {
  return { statusCode: status, headers: cors(), body: JSON.stringify(body) }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' })

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const to = String(body.to || '')
    .trim()
    .toLowerCase()
  const subject = String(body.subject || 'GlowUP notification').trim().slice(0, 200)
  const text = String(body.body || '').trim().slice(0, 8000)
  if (!to || !to.includes('@') || !text) {
    return json(400, { error: 'to, subject, and body required' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    'GlowUP. <bookings@mail.glowupbeautysolutions.com>'
  const replyTo =
    process.env.RESEND_REPLY_TO || 'aaron.elrod@glowupbeautysolutions.com'

  if (!apiKey) {
    return json(200, {
      ok: false,
      fallback: 'mailto',
      message: 'RESEND_API_KEY not configured — use mailto compose',
    })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject,
        text,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return json(200, {
        ok: false,
        fallback: 'mailto',
        error: data.message || data.name || `Resend ${res.status}`,
      })
    }
    return json(200, {
      ok: true,
      id: data.id,
      to,
      kind: body.kind || 'custom',
    })
  } catch (e) {
    return json(200, {
      ok: false,
      fallback: 'mailto',
      error: e instanceof Error ? e.message : 'email failed',
    })
  }
}
