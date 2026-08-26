/** Shared Resend send used by /api/email and Glo desk booking confirms. */

export async function sendResendEmail({ to, subject, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    'GlowUP. <bookings@mail.glowupbeautysolutions.com>'
  const reply = replyTo || process.env.RESEND_REPLY_TO || ''
  if (!apiKey) return { ok: false, fallback: 'mailto', error: 'RESEND_API_KEY not configured' }
  const email = String(to || '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) return { ok: false, error: 'invalid to' }
  try {
    const payload = {
      from,
      to: [email],
      subject: String(subject || 'GlowUP notification').slice(0, 200),
      text: String(text || '').slice(0, 8000),
    }
    if (reply.includes('@')) payload.reply_to = reply
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, fallback: 'mailto', error: data.message || data.name || `Resend ${res.status}` }
    return { ok: true, id: data.id, to: email }
  } catch (e) {
    return { ok: false, fallback: 'mailto', error: e instanceof Error ? e.message : 'email failed' }
  }
}

export async function loadOpsSnap(key) {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('glowup-ops')
    const raw = await store.get(key, { type: 'json' })
    if (raw && typeof raw === 'object') return raw
  } catch {
    /* empty */
  }
  const memory = globalThis.__glowupOps
  return memory?.get(key) || null
}

export function allowedRecipient(snap, { email, phone }) {
  const settings = snap?.settings && typeof snap.settings === 'object' ? snap.settings : {}
  const emails = new Set(
    [snap?.ownerEmail, settings.ownerNotifyEmail]
      .map((v) => String(v || '').trim().toLowerCase())
      .filter((v) => v.includes('@')),
  )
  const phones = new Set(
    [settings.ownerNotifyPhone]
      .map((v) => String(v || '').replace(/\D/g, '').slice(-10))
      .filter((v) => v.length >= 7),
  )
  for (const c of Array.isArray(snap?.clients) ? snap.clients : []) {
    const e = String(c.email || '').trim().toLowerCase()
    if (e.includes('@')) emails.add(e)
    const p = String(c.phone || '').replace(/\D/g, '').slice(-10)
    if (p.length >= 7) phones.add(p)
  }
  for (const a of Array.isArray(snap?.appointments) ? snap.appointments : []) {
    const e = String(a.clientEmail || '').trim().toLowerCase()
    if (e.includes('@')) emails.add(e)
    const p = String(a.clientPhone || '').replace(/\D/g, '').slice(-10)
    if (p.length >= 7) phones.add(p)
  }
  if (email && emails.has(String(email).trim().toLowerCase())) return true
  if (phone) {
    const d = String(phone).replace(/\D/g, '').slice(-10)
    if (d.length >= 7 && [...phones].some((p) => p.endsWith(d.slice(-7)) || d.endsWith(p.slice(-7)))) return true
  }
  return false
}
