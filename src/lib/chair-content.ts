/** Today's real chair moments — no invented services. */

import { listForDay, toISODate, type Appointment } from './calendar-store'

export type ChairMoment = {
  id: string
  service: string
  stylist: string
  time: string
  dateISO: string
  notes: string
  status: Appointment['status']
  label: string
}

export function listChairMoments(dateISO = toISODate(new Date())): ChairMoment[] {
  return listForDay(dateISO)
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .map((a) => ({
      id: a.id,
      service: a.service,
      stylist: a.stylist,
      time: a.time,
      dateISO: a.dateISO,
      notes: (a.notes || '').trim(),
      status: a.status,
      label: `${a.service} · ${a.stylist} · ${a.time}`,
    }))
}

export function chairConsentLine(consent: { face: boolean; back: boolean }): string {
  if (consent.face) return 'Consent: face allowed. Stay editorial.'
  if (consent.back) return 'Consent: back-of-head / hands / product only. Do not describe a face.'
  return 'Consent: product-only. No person in frame.'
}

export function formatChairExtra(moment: ChairMoment, consent: { face: boolean; back: boolean }): string {
  return [
    'CHAIR MOMENT (do not invent beyond this):',
    `Service: ${moment.service}`,
    `Stylist: ${moment.stylist}`,
    `Time: ${moment.time} on ${moment.dateISO}`,
    moment.notes ? `Stylist notes: ${moment.notes}` : 'No extra notes.',
    chairConsentLine(consent),
    'Social must not name the guest.',
  ].join('\n')
}
