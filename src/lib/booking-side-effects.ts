/**
 * Phase B — after a booking lands: CRM already handled by caller;
 * here: confirm SMS/email, owner alerts, optional deposit request.
 */

import type { Appointment } from './calendar-store'
import { setPaymentStatus } from './calendar-store'
import {
  buildBookingConfirm,
  buildOwnerAlert,
  dispatchMessage,
  type OutboundMessage,
} from './notifications-store'
import { getDepositUrl } from './payments'
import { loadOpsSettings } from './ops-settings'

export type BookingSideEffectResult = {
  confirms: number
  ownerAlerts: number
  dispatched: { twilio: number; native: number; email: number; resend: number; failed: number }
  depositRequested: boolean
  depositUrl?: string
}

export async function runBookingSideEffects(appt: Appointment): Promise<BookingSideEffectResult> {
  const settings = loadOpsSettings()
  const result: BookingSideEffectResult = {
    confirms: 0,
    ownerAlerts: 0,
    dispatched: { twilio: 0, native: 0, email: 0, resend: 0, failed: 0 },
    depositRequested: false,
  }

  if (!settings.messagingEnabled && !settings.autoDepositOnBook) {
    return result
  }

  let depositUrl: string | undefined
  if (settings.autoDepositOnBook && settings.stripePaymentLink?.trim()) {
    depositUrl = getDepositUrl(appt) || undefined
    if (depositUrl) {
      setPaymentStatus(appt.id, 'deposit_requested', settings.depositAmount)
      result.depositRequested = true
      result.depositUrl = depositUrl
    }
  } else if (settings.stripePaymentLink?.trim()) {
    // Include link in confirm even if not auto-marking deposit
    depositUrl = getDepositUrl(appt) || settings.stripePaymentLink.trim()
  }

  const toSend: OutboundMessage[] = []

  if (settings.messagingEnabled && settings.autoSmsOnBook !== false) {
    const confirms = buildBookingConfirm({
      clientName: appt.clientName,
      clientPhone: appt.clientPhone,
      clientEmail: appt.clientEmail,
      service: appt.service,
      dateLabel: appt.dateLabel,
      time: appt.time,
      studioName: settings.studioName || 'Studio',
      appointmentId: appt.id,
      depositLink: depositUrl,
      depositAmount:
        depositUrl && settings.depositAmount
          ? `${settings.depositCurrency || 'USD'} ${settings.depositAmount}`
          : undefined,
    })
    result.confirms = confirms.length
    toSend.push(...confirms)
  }

  if (settings.messagingEnabled && settings.autoOwnerAlert !== false) {
    const alerts = buildOwnerAlert({
      ownerEmail: settings.ownerNotifyEmail,
      ownerPhone: settings.ownerNotifyPhone,
      clientName: appt.clientName,
      service: appt.service,
      dateLabel: appt.dateLabel,
      time: appt.time,
      appointmentId: appt.id,
    })
    result.ownerAlerts = alerts.length
    toSend.push(...alerts)
  }

  // Deposit SMS is covered in confirm when deposit link present; optional extra if auto + phone
  // (confirm already includes deposit line)

  for (const msg of toSend) {
    try {
      // No native popups on auto book — Twilio/Resend or leave in Ops outbox
      const r = await dispatchMessage(msg, { allowNative: false })
      if (r.path === 'twilio') result.dispatched.twilio++
      else if (r.path === 'resend') result.dispatched.resend++
      else if (r.ok && r.path === 'native') result.dispatched.native++
      else if (r.ok && r.path === 'mailto') result.dispatched.email++
      else if (!r.ok) result.dispatched.failed++
      else result.dispatched.failed++
    } catch {
      result.dispatched.failed++
    }
  }

  return result
}
