/**
 * POST /api/email
 * { salonKey, to, subject, body, kind? }
 * salonKey must be the owner ops key (gu_…). Recipient must belong to that salon.
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
  const to = String(body.to || '')
    .trim()
    .toLowerCase()
  const subject = String(body.subject || 'GlowUP notification').trim().slice(0, 200)
  const text = String(body.body || '').trim().slice(0, 8000)
  if (!salonKey || salonKey.startsWith('gd_') || salonKey.length < 8) {
    return json(401, { error: 'salonKey (owner key) required' })
  }
  if (!to || !to.includes('@') || !text) {
    return json(400, { error: 'to, subject, and body required' })
  }

  const { loadOpsSnap, allowedRecipient, sendResendEmail } = await import('./_lib/send-resend.mjs')
  const snap = await loadOpsSnap(salonKey)
  if (!snap || String(snap.salonSyncKey || salonKey) !== salonKey) {
    return json(401, { error: 'Unknown salon' })
  }
  if (!allowedRecipient(snap, { email: to })) {
    return json(403, { error: 'Recipient is not on this salon book' })
  }

  const settings = snap.settings && typeof snap.settings === 'object' ? snap.settings : {}
  const replyTo =
    String(settings.ownerNotifyEmail || snap.ownerEmail || process.env.RESEND_REPLY_TO || '').trim()
  const sent = await sendResendEmail({ to, subject, text, replyTo })
  if (!sent.ok) {
    return json(200, {
      ok: false,
      fallback: sent.fallback || 'mailto',
      error: sent.error,
    })
  }
  return json(200, {
    ok: true,
    id: sent.id,
    to,
    kind: body.kind || 'custom',
  })
}
