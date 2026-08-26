/** Stripe deposit path — Payment Link in settings (no server secret required for Phase 1) */

import { loadOpsSettings } from './ops-settings'
import { setPaymentStatus, type Appointment } from './calendar-store'
import { queueMessage } from './notifications-store'

export function getDepositUrl(appointment?: Appointment): string | null {
  const link = loadOpsSettings().stripePaymentLink?.trim()
  if (!link) return null
  // Stripe Payment Links accept client_reference_id query on some plans; always pass amount note in message
  try {
    const u = new URL(link)
    if (appointment?.id) u.searchParams.set('client_reference_id', appointment.id.slice(0, 32))
    return u.toString()
  } catch {
    return link
  }
}

export function requestDeposit(appt: Appointment): { ok: boolean; url?: string; error?: string } {
  const settings = loadOpsSettings()
  const url = getDepositUrl(appt)
  if (!url) {
    return {
      ok: false,
      error: 'Add a Stripe Payment Link in Ops → Payments (Dashboard → create Payment Link for deposits).',
    }
  }
  setPaymentStatus(appt.id, 'deposit_requested', settings.depositAmount)
  const body = [
    `Hi ${appt.clientName},`,
    ``,
    `Please secure your ${appt.service} on ${appt.dateLabel} at ${appt.time} with a ${settings.depositCurrency} ${settings.depositAmount} deposit:`,
    url,
    ``,
    `— ${settings.studioName || 'Studio'}`,
  ].join('\n')
  const msg = queueMessage({
    channel: 'sms',
    to: appt.clientPhone,
    subject: 'Deposit request',
    body: body.slice(0, 400),
    kind: 'deposit_request',
    relatedAppointmentId: appt.id,
  })
  // Live SMS when Twilio configured; else native compose still available in Ops
  void import('./notifications-store').then((n) => n.dispatchMessage(msg)).catch(() => undefined)
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return { ok: true, url }
}

export function markPaid(apptId: string) {
  setPaymentStatus(apptId, 'paid')
}

export function markWaived(apptId: string) {
  setPaymentStatus(apptId, 'waived')
}
