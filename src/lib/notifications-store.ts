/** SMS / email outbox — production-shaped pipeline; sends via deep links until Twilio/Resend keys */

export type MessageChannel = 'sms' | 'email'
export type MessageStatus = 'queued' | 'opened' | 'copied' | 'sent_via_provider' | 'failed'

export type OutboundMessage = {
  id: string
  createdAt: string
  channel: MessageChannel
  to: string
  subject: string
  body: string
  status: MessageStatus
  kind: 'booking_confirm' | 'booking_remind' | 'owner_alert' | 'deposit_request' | 'custom'
  relatedAppointmentId?: string
}

const KEY = 'glowup_notifications_v1'

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll(): OutboundMessage[] {
  if (!canUse()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const p = JSON.parse(raw) as OutboundMessage[]
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

function writeAll(list: OutboundMessage[]) {
  if (!canUse()) return
  window.localStorage.setItem(KEY, JSON.stringify(list))
}

export function listMessages(limit = 50): OutboundMessage[] {
  return readAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function queueMessage(
  input: Omit<OutboundMessage, 'id' | 'createdAt' | 'status'> & { status?: MessageStatus },
): OutboundMessage {
  const msg: OutboundMessage = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: input.status || 'queued',
    channel: input.channel,
    to: input.to,
    subject: input.subject,
    body: input.body,
    kind: input.kind,
    relatedAppointmentId: input.relatedAppointmentId,
  }
  const all = readAll()
  all.push(msg)
  writeAll(all)
  return msg
}

export function markMessage(id: string, status: MessageStatus) {
  const all = readAll()
  const idx = all.findIndex((m) => m.id === id)
  if (idx < 0) return
  all[idx] = { ...all[idx], status }
  writeAll(all)
}

export function buildBookingConfirm(input: {
  clientName: string
  clientPhone: string
  clientEmail?: string
  service: string
  dateLabel: string
  time: string
  studioName: string
  appointmentId: string
  depositLink?: string
  depositAmount?: string
}) {
  const depositLine = input.depositLink
    ? `Secure your chair${input.depositAmount ? ` (${input.depositAmount})` : ''} with a deposit: ${input.depositLink}`
    : `Reply if you need to reschedule.`
  const body = [
    `Hi ${input.clientName},`,
    ``,
    `You're confirmed at ${input.studioName}:`,
    `${input.service}`,
    `${input.dateLabel} at ${input.time}`,
    ``,
    depositLine,
    ``,
    `— ${input.studioName} (via GlowUP.)`,
  ].join('\n')

  const msgs: OutboundMessage[] = []
  if (input.clientPhone) {
    msgs.push(
      queueMessage({
        channel: 'sms',
        to: input.clientPhone,
        subject: 'Booking confirmed',
        body: body.replace(/\n\n/g, '\n').slice(0, 320),
        kind: 'booking_confirm',
        relatedAppointmentId: input.appointmentId,
      }),
    )
  }
  if (input.clientEmail) {
    msgs.push(
      queueMessage({
        channel: 'email',
        to: input.clientEmail,
        subject: `Confirmed: ${input.service} · ${input.dateLabel}`,
        body,
        kind: 'booking_confirm',
        relatedAppointmentId: input.appointmentId,
      }),
    )
  }
  return msgs
}

export function buildOwnerAlert(input: {
  ownerEmail?: string
  ownerPhone?: string
  clientName: string
  service: string
  dateLabel: string
  time: string
  appointmentId: string
}) {
  const body = `New booking: ${input.clientName} · ${input.service} · ${input.dateLabel} ${input.time}`
  const out: OutboundMessage[] = []
  if (input.ownerPhone) {
    out.push(
      queueMessage({
        channel: 'sms',
        to: input.ownerPhone,
        subject: 'New booking',
        body,
        kind: 'owner_alert',
        relatedAppointmentId: input.appointmentId,
      }),
    )
  }
  if (input.ownerEmail) {
    out.push(
      queueMessage({
        channel: 'email',
        to: input.ownerEmail,
        subject: `New booking · ${input.clientName}`,
        body,
        kind: 'owner_alert',
        relatedAppointmentId: input.appointmentId,
      }),
    )
  }
  return out
}

export function buildRemindersForTomorrow(appts: {
  id: string
  clientName: string
  clientPhone: string
  service: string
  dateISO: string
  dateLabel: string
  time: string
}[]): OutboundMessage[] {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const iso = tomorrow.toISOString().slice(0, 10)
  const out: OutboundMessage[] = []
  for (const a of appts.filter((x) => x.dateISO === iso && x.clientPhone)) {
    out.push(
      queueMessage({
        channel: 'sms',
        to: a.clientPhone,
        subject: 'Reminder',
        body: `Reminder: ${a.service} tomorrow ${a.time} (${a.dateLabel}). See you soon!`,
        kind: 'booking_remind',
        relatedAppointmentId: a.id,
      }),
    )
  }
  return out
}

/** Open native compose (SMS/email) — fallback when Twilio not configured */
export function openNativeSend(msg: OutboundMessage) {
  if (msg.channel === 'sms') {
    const body = encodeURIComponent(msg.body)
    const digits = msg.to.replace(/[^\d+]/g, '')
    window.open(`sms:${digits}?&body=${body}`, '_blank')
    markMessage(msg.id, 'opened')
    return
  }
  const subject = encodeURIComponent(msg.subject)
  const body = encodeURIComponent(msg.body)
  window.open(`mailto:${encodeURIComponent(msg.to)}?subject=${subject}&body=${body}`, '_blank')
  markMessage(msg.id, 'opened')
}

export type DispatchOptions = {
  /** Open sms:/mailto: if provider missing (default true for Ops buttons; false for auto book) */
  allowNative?: boolean
}

/**
 * Live SMS: Twilio via /api/sms; fall back to native compose.
 * Email: Resend via /api/email when configured; else mailto.
 */
export async function dispatchMessage(
  msg: OutboundMessage,
  options: DispatchOptions = {},
): Promise<{
  ok: boolean
  path: 'twilio' | 'native' | 'mailto' | 'resend'
  error?: string
}> {
  const allowNative = options.allowNative !== false

  if (msg.channel === 'email') {
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: msg.to,
          subject: msg.subject,
          body: msg.body,
          kind: msg.kind,
        }),
        cache: 'no-store',
      })
      const data = (await res.json()) as { ok?: boolean; fallback?: string; error?: string; id?: string }
      if (data.ok) {
        markMessage(msg.id, 'sent_via_provider')
        return { ok: true, path: 'resend' }
      }
    } catch {
      /* fall through */
    }
    if (allowNative) {
      openNativeSend(msg)
      return { ok: true, path: 'mailto' }
    }
    markMessage(msg.id, 'queued')
    return { ok: false, path: 'mailto', error: 'Email queued — set RESEND_API_KEY or Send from Ops' }
  }

  const { sendSms } = await import('./sms-client')
  const r = await sendSms({ to: msg.to, body: msg.body, kind: msg.kind })
  if (r.ok) {
    markMessage(msg.id, 'sent_via_provider')
    return { ok: true, path: 'twilio' }
  }
  if (allowNative) {
    openNativeSend(msg)
    return { ok: true, path: 'native', error: r.error }
  }
  // Stay queued for Ops manual send when Twilio not configured
  markMessage(msg.id, 'queued')
  return {
    ok: false,
    path: 'native',
    error: r.error || 'SMS queued — set Twilio on Netlify or Send from Ops outbox',
  }
}

/** Queue tomorrow's reminders and send SMS live (Twilio or native). */
export async function sendRemindersForTomorrow(
  appts: {
    id: string
    clientName: string
    clientPhone: string
    service: string
    dateISO: string
    dateLabel: string
    time: string
  }[],
): Promise<{ queued: number; sent: number; native: number }> {
  const msgs = buildRemindersForTomorrow(appts)
  let sent = 0
  let native = 0
  for (const m of msgs) {
    const r = await dispatchMessage(m)
    if (r.path === 'twilio') sent++
    else if (r.path === 'native') native++
  }
  return { queued: msgs.length, sent, native }
}

export function copyMessageBody(msg: OutboundMessage) {
  void navigator.clipboard?.writeText(msg.body)
  markMessage(msg.id, 'copied')
}

export function replaceAllMessages(list: OutboundMessage[]) {
  writeAll(list)
}
