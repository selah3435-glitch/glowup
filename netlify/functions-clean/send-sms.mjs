/**
 * POST /api/sms
 * { to, body, kind? }
 * Sends via Twilio when TWILIO_ACCOUNT_SID + From number +
 * (TWILIO_API_KEY_SID/SECRET or TWILIO_AUTH_TOKEN) are set.
 * Otherwise returns { ok:false, fallback:'native' } so client can open sms: link.
 */

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function json(status, body) {
  return { statusCode: status, headers: cors(), body: JSON.stringify(body) }
}

function toE164(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length === 10) return `+1${d}`
  if (d.length === 11 && d.startsWith('1')) return `+${d}`
  if (String(raw).trim().startsWith('+')) return `+${d}`
  return `+${d}`
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

  const salonKey = String(body.salonKey || '').trim()
  const to = toE164(body.to)
  const text = String(body.body || '').trim().slice(0, 1500)
  if (!salonKey || salonKey.startsWith('gd_') || salonKey.length < 8) {
    return json(401, { error: 'salonKey (owner key) required' })
  }
  if (!to || to.length < 11 || !text) {
    return json(400, { error: 'to and body required' })
  }
  const { loadOpsSnap, allowedRecipient } = await import('./_lib/send-resend.mjs')
  const snap = await loadOpsSnap(salonKey)
  if (!snap || String(snap.salonSyncKey || salonKey) !== salonKey) {
    return json(401, { error: 'Unknown salon' })
  }
  if (!allowedRecipient(snap, { phone: body.to })) {
    return json(403, { error: 'Recipient is not on this salon book' })
  }

  const sid = process.env.TWILIO_ACCOUNT_SID
  const apiKeySid = process.env.TWILIO_API_KEY_SID
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM || process.env.TWILIO_PHONE_NUMBER
  const user = apiKeySid && apiKeySecret ? apiKeySid : sid
  const pass = apiKeySid && apiKeySecret ? apiKeySecret : token

  if (!sid || !pass || !from) {
    return json(200, {
      ok: false,
      fallback: 'native',
      message: 'Twilio not configured — use native SMS compose',
    })
  }

  try {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: text,
      }).toString(),
    })
    const data = await res.json()
    if (!res.ok) {
      return json(200, {
        ok: false,
        fallback: 'native',
        error: data.message || `Twilio ${res.status}`,
      })
    }
    return json(200, {
      ok: true,
      sid: data.sid,
      status: data.status,
      to,
      kind: body.kind || 'custom',
    })
  } catch (e) {
    return json(200, {
      ok: false,
      fallback: 'native',
      error: e instanceof Error ? e.message : 'sms failed',
    })
  }
}
